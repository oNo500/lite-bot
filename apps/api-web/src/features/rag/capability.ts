import { retrieveRagContext } from './queries/retrieve-rag-context'

import type { RagConfig, RagContext } from './queries/types'
import type { ChatCapability } from '@/features/chat/types'

export const capability: ChatCapability<RagConfig> = {
  id: 'rag',

  async preStream(ctx, config) {
    if (!ctx.userId) return ctx
    const rag = await retrieveRagContext(ctx.query, ctx.userId, config)
    return { ...ctx, metadata: { ...ctx.metadata, rag } }
  },

  buildSystemPrompt(ctx) {
    const rag = ctx.metadata.rag as RagContext | undefined
    if (!rag?.system) return Promise.resolve(null)
    return Promise.resolve(rag.system)
  },

  onStreamStart(writer, ctx) {
    const rag = ctx.metadata.rag as RagContext | undefined
    if (rag && rag.sources.length > 0) {
      writer.write({ type: 'data-rag-sources', data: rag.sources } as never)
    }
    return Promise.resolve()
  },
}
