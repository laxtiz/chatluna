import { ChatLunaPlugin } from 'koishi-plugin-chatluna/services/chat'
import { Context, Logger, Schema } from 'koishi'
import { OpenAIClient } from './client'
import { createLogger } from 'koishi-plugin-chatluna/utils/logger'
import { AzureOpenAIClientConfig } from './types'

export let logger: Logger

export function apply(ctx: Context, config: Config) {
    const plugin = new ChatLunaPlugin<AzureOpenAIClientConfig, Config>(
        ctx,
        config,
        'azure'
    )

    logger = createLogger(ctx, 'chatluna-openai-adapter')

    ctx.on('ready', async () => {
        await plugin.registerToService()

        await plugin.parseConfig((config) => {
            return config.apiKeys.map(([apiKey, apiEndpoint]) => {
                return {
                    apiKey,
                    apiEndpoint,
                    // [{model,xx}] => Record<string(model),{}>
                    supportModels: config.supportModels.reduce((acc, value) => {
                        acc[value.model] = value
                        return acc
                    }, {}),
                    platform: 'azure',
                    chatLimit: config.chatTimeLimit,
                    timeout: config.timeout,
                    maxRetries: config.maxRetries,
                    concurrentMaxSize: config.chatConcurrentMaxSize
                }
            })
        })

        await plugin.registerClient(
            (_, clientConfig) =>
                new OpenAIClient(ctx, config, clientConfig, plugin)
        )

        await plugin.initClients()
    })
}

export interface Config extends ChatLunaPlugin.Config {
    apiKeys: [string, string][]
    maxTokens: number
    supportModels: {
        model: string
        modelType: string
        modelVersion: string
        contextSize: number
    }[]
    temperature: number
    presencePenalty: number
    frequencyPenalty: number
}

export const Config: Schema<Config> = Schema.intersect([
    ChatLunaPlugin.Config,
    Schema.object({
        apiKeys: Schema.array(
            Schema.tuple([
                Schema.string()
                    .role('secret')
                    .description('Azure OpenAI 的 API Key')
                    .required(),
                Schema.string()
                    .description('请求 Azure OpenAI API 的地址')
                    .default('https://api.openai.com/v1')
            ])
        )
            .description('Azure OpenAI 的 API Key 和请求地址列表')
            .default([['', 'https://api.openai.com/v1']])
    }).description('请求设置'),

    Schema.object({
        supportModels: Schema.array(
            Schema.object({
                model: Schema.string().description('模型名称').required(),
                modelType: Schema.union([
                    'LLM 大语言模型',
                    'LLM 大语言模型（函数调用）',
                    'Embeddings 嵌入模型'
                ])
                    .default('LLM 大语言模型')
                    .description('模型类型'),
                modelVersion: Schema.string()
                    .description('模型版本')
                    .default('2023-03-15-preview'),
                contextSize: Schema.number()
                    .description('模型上下文大小')
                    .default(4096)
            }).role('table')
        )
            .description('支持的模型列表')
            .default([]),
        maxTokens: Schema.number()
            .description(
                '回复的最大 Token 数（16~128000，必须是16的倍数）（注意如果你目前使用的模型的最大 Token 为 8000 及以上的话才建议设置超过 512 token）'
            )
            .min(16)
            .max(128000)
            .step(16)
            .default(1024),
        temperature: Schema.percent()
            .description('回复温度，越高越随机')
            .min(0)
            .max(1)
            .step(0.1)
            .default(0.8),
        presencePenalty: Schema.number()
            .description(
                '重复惩罚，越高越不易重复出现过至少一次的 Token（-2~2，每步0.1）'
            )
            .min(-2)
            .max(2)
            .step(0.1)
            .default(0.2),
        frequencyPenalty: Schema.number()
            .description(
                '频率惩罚，越高越不易重复出现次数较多的 Token（-2~2，每步0.1）'
            )
            .min(-2)
            .max(2)
            .step(0.1)
            .default(0.2)
    }).description('模型设置')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
]) as any

export const inject = ['chatluna']

export const name = 'chatluna-openai-adapter'
