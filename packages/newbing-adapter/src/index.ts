import { Conversation, ConversationConfig, LLMChatAdapter, LLMChatService, Message, SimpleMessage, createLogger } from '@dingyi222666/koishi-plugin-chathub';
import { Context, Logger, Schema } from 'koishi';
import { NewBingClient } from './client';
import { BingConversation, ToneStyle } from './types';


const logger = createLogger('@dingyi222666/chathub-newbing-adapter')


class NewBingAdapter extends LLMChatAdapter<NewBingAdapter.Config> {

    private conversationConfig: ConversationConfig

    public supportInject: boolean

    label: string

    private client: NewBingClient


    constructor(ctx: Context, public config: NewBingAdapter.Config) {
        super(ctx, config)
        logger.info(`NewBing Adapter started`)

        this.supportInject = false

        this.client = new NewBingClient(config, ctx)
    }

    async init(config: ConversationConfig): Promise<void> {
        this.conversationConfig = config

        //TODO: check cookie and apiEndPoint
        return Promise.resolve()
    }

    async ask(conversation: Conversation, message: Message): Promise<Message> {
        try {
            const simpleMessage = await this.client.ask({
                toneStyle: this.config.toneStyle as ToneStyle,
                conversation: conversation,
                message: message,
            })

            return {
                ...simpleMessage
            }
        } catch (e) {
            logger.error(e)
            throw e
        }
    }

    clear(): void {
        this.client.reset()
    }

}

namespace NewBingAdapter {


    export const using = ['llmchat']

    export interface Config extends LLMChatService.Config {
        cookie: string,
        toneStyle: string,
        sydney: boolean,
        showExtraInfo: boolean,
        //  showLinkInfo: boolean,
    }

    export const Config: Schema<Config> = Schema.intersect([
        LLMChatService.createConfig({ label: 'bing' }),

        Schema.object({
            cookie: Schema.string().description('Bing账号的cookie').default("").required()
        }).description('请求设置'),

        Schema.object({
            toneStyle: Schema.union(
                [
                    Schema.const("balanced").description("平衡"),
                    Schema.const("creative").description("创造"),
                    Schema.const("precise").description("精准"),
                    Schema.const("fast").description("新平衡（gpt-3.5,更快的响应速度）"),
                ]
            ).description('对话风格').default("fast"),
            sydney: Schema.boolean().description('是否开启Sydeny模式（破解对话20次回复数限制，账号可能会有风险）').default(false),
        }).description('模型设置'),

        Schema.object({
            showExtraInfo: Schema.boolean().description('是否显示额外信息（如剩余回复数，猜你想问）').default(false),
            // showLinkInfo: Schema.boolean().description('是否显示Bing引用的链接信息').default(false),
        }).description('对话设置'),

    ])
}

export const name = '@dingyi222666/chathub-newbing-adapter'

export default NewBingAdapter