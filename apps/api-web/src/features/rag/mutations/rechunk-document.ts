import { and, eq } from 'drizzle-orm'

import { db } from '@/db'
import { ragChunk, ragDocument } from '@/db/schema'
import { chunkText } from '@/lib/rag/chunk'
import { embedTexts } from '@/lib/rag/embed'

import type { ChunkConfig } from '@/lib/rag/types'

export type RechunkResult
  = | { ok: true }
    | { ok: false, reason: 'not-found' | 'no-raw-content' }

export interface RechunkDocumentParams {
  documentId: string
  userId: string
  config: ChunkConfig
}

export async function rechunkDocument(
  params: RechunkDocumentParams,
): Promise<RechunkResult> {
  const { documentId, userId, config } = params

  const [doc] = await db
    .select({
      id: ragDocument.id,
      rawContent: ragDocument.rawContent,
    })
    .from(ragDocument)
    .where(and(eq(ragDocument.id, documentId), eq(ragDocument.userId, userId)))
    .limit(1)

  if (!doc) return { ok: false, reason: 'not-found' }
  if (doc.rawContent === null) return { ok: false, reason: 'no-raw-content' }

  await db
    .update(ragDocument)
    .set({ status: 'processing', chunkConfig: config })
    .where(eq(ragDocument.id, documentId))

  await db.delete(ragChunk).where(eq(ragChunk.documentId, documentId))

  const chunks = chunkText(doc.rawContent, config)

  if (chunks.length === 0) {
    await db
      .update(ragDocument)
      .set({ status: 'ready' })
      .where(eq(ragDocument.id, documentId))
    return { ok: true }
  }

  const embeddings = await embedTexts(chunks.map((c) => c.content))

  const rows = chunks.map((chunk, i) => ({
    documentId,
    content: chunk.content,
    embedding: embeddings[i]!,
    chunkIndex: i,
    charStart: chunk.charStart,
    charEnd: chunk.charEnd,
    tokenCount: chunk.tokenCount,
  }))

  await db.insert(ragChunk).values(rows)
  await db
    .update(ragDocument)
    .set({ status: 'ready' })
    .where(eq(ragDocument.id, documentId))

  return { ok: true }
}
