import { Context } from 'koishi'
import { ChainMiddlewareRunStatus, ChatChain } from '../chains/chain'
import { Config } from '../config'

export function apply(ctx: Context, config: Config, chain: ChatChain) {
    chain
        .middleware('clear_balance', async (session, context) => {
            const { command } = context

            if (command !== 'clear_balance')
                return ChainMiddlewareRunStatus.SKIPPED

            const { authUser: userId } = context.options

            const service = ctx.chatluna_auth

            const modifiedBalance = await service.setBalance(session, 0, userId)

            context.message = `已将用户 ${userId} 账户余额修改为 ${modifiedBalance}`

            return ChainMiddlewareRunStatus.STOP
        })
        .after('lifecycle-handle_command')
}

declare module '../chains/chain' {
    interface ChainMiddlewareName {
        clear_balance: never
    }
}
