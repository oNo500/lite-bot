import { and, asc, eq } from 'drizzle-orm'

import { db } from '@/db'
import { ragChunk, ragDocument } from '@/db/schema'

import type { ChunkConfig } from '@/lib/rag/types'

export interface ChunkListItem {
  id: string
  chunkIndex: number
  content: string
  editedContent: string | null
  charStart: number
  charEnd: number
  tokenCount: number
  enabled: boolean
}

export interface DocumentChunksResult {
  document: {
    id: string
    name: string
    rawContent: string | null
    chunkConfig: ChunkConfig | null
  }
  chunks: ChunkListItem[]
}

export async function getDocumentChunks(
  documentId: string,
  userId: string,
): Promise<DocumentChunksResult | null> {
  const [doc] = await db
    .select({
      id: ragDocument.id,
      name: ragDocument.name,
      rawContent: ragDocument.rawContent,
      chunkConfig: ragDocument.chunkConfig,
    })
    .from(ragDocument)
    .where(and(eq(ragDocument.id, documentId), eq(ragDocument.userId, userId)))
    .limit(1)

  if (!doc) return null

  const chunks = await db
    .select({
      id: ragChunk.id,
      chunkIndex: ragChunk.chunkIndex,
      content: ragChunk.content,
      editedContent: ragChunk.editedContent,
      charStart: ragChunk.charStart,
      charEnd: ragChunk.charEnd,
      tokenCount: ragChunk.tokenCount,
      enabled: ragChunk.enabled,
    })
    .from(ragChunk)
    .where(eq(ragChunk.documentId, documentId))
    .orderBy(asc(ragChunk.chunkIndex))

  return { document: doc, chunks }
}
