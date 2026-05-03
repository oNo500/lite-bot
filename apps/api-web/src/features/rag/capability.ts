import { retrieveRagContext } from "./queries/retrieve-rag-context";

import type { RagConfig, RagContext } from "./queries/types";
import type { ChatCapability } from "@/features/chat/types";

export const capability: ChatCapability<RagConfig> = {
  id: "rag",

  meta: {
    name: "知识库 (RAG)",
    description: "从用户上传的文档中检索相关片段，注入到 system prompt 引导模型使用。",
  },

  async preStream(ctx, config) {
    if (!ctx.userId) return ctx;
    const rag = await retrieveRagContext(ctx.query, ctx.userId, config);
    return { ...ctx, metadata: { ...ctx.metadata, rag } };
  },

  buildSystemPrompt(ctx) {
    const rag = ctx.metadata.rag as RagContext | undefined;
    if (!rag?.system) return Promise.resolve(null);
    return Promise.resolve(rag.system);
  },

  onStreamStart(writer, ctx) {
    const rag = ctx.metadata.rag as RagContext | undefined;
    if (rag && rag.sources.length > 0) {
      writer.write({ type: "data-rag-sources", data: rag.sources } as never);
    }
    return Promise.resolve();
  },
};
