import { embedTexts } from "@/lib/rag/embed";

import { searchSimilarChunks } from "./search-similar-chunks";

import type { RagConfig, RagContext, RetrievedChunk } from "./types";

const SYSTEM_HEADER = `You are a helpful assistant. Use the following knowledge base context to answer.
When citing the knowledge base, append the chunk marker like [^c1] immediately after the cited claim.
If the context isn't relevant, refuse to cite.`;

export async function retrieveRagContext(
  query: string,
  userId: string,
  config: RagConfig,
): Promise<RagContext> {
  const [queryEmbedding] = await embedTexts([query]);
  if (!queryEmbedding) return { system: "", sources: [] };

  const rows = await searchSimilarChunks(queryEmbedding, userId, config);
  if (rows.length === 0) return { system: "", sources: [] };

  const sources: RetrievedChunk[] = rows.map((row, i) => ({
    marker: `c${i + 1}`,
    chunkId: row.chunkId,
    documentId: row.documentId,
    documentName: row.documentName,
    content: row.content,
    charStart: row.charStart,
    charEnd: row.charEnd,
    similarity: row.similarity,
  }));

  const body = sources
    .map((s) => `[^${s.marker}] (from "${s.documentName}")\n${s.content}`)
    .join("\n\n");

  const system = `${SYSTEM_HEADER}\n\n<knowledge_base>\n${body}\n</knowledge_base>`;

  return { system, sources };
}
