import { Context } from 'koishi'
import fs from 'fs/promises'
import { ChatLunaPlugin } from 'koishi-plugin-chatluna/services/chat'
import { Config } from '.'
import { ClientConfig } from 'koishi-plugin-chatluna/llm-core/platform/config'
import path from 'path'
import { fileURLToPath } from 'url'

export async function embeddings(
    ctx: Context,
    config: Config,
    plugin: ChatLunaPlugin<ClientConfig, Config>
) {
    const dirname =
        __dirname?.length > 0 ? __dirname : fileURLToPath(import.meta.url)
    const list = await fs.readdir(path.join(dirname, 'embeddings'))

    for (const file of list) {
        if (file.endsWith('.d.ts')) {
            continue
        }

        const embeddings: {
            apply: (
                ctx: Context,
                config: Config,
                plugin: ChatLunaPlugin<ClientConfig, Config>
            ) => PromiseLike<void> | void
        } = await import(`./embeddings/${file}`)

        if (embeddings.apply) {
            await embeddings.apply(ctx, config, plugin)
        }
    }
}
