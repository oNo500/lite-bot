import { searchSimilarChunks } from '@/db/rag-queries'

import { embedTexts } from './embed'

export async function buildRagSystemPrompt(query: string, userId: string): Promise<string> {
  const [queryEmbedding] = await embedTexts([query])
  if (!queryEmbedding) return getDefaultSystem()

  const chunks = await searchSimilarChunks(queryEmbedding, userId)
  if (chunks.length === 0) return getDefaultSystem()

  const context = chunks
    .map((c) => `[${c.documentName}]\n${c.content}`)
    .join('\n\n---\n\n')

  return `You are a helpful assistant. Use the following knowledge base context to answer the user's question. If the context doesn't contain relevant information, answer based on your general knowledge.

<knowledge_base>
${context}
</knowledge_base>`
}

function getDefaultSystem(): string {
  return 'You are a helpful assistant.'
}
