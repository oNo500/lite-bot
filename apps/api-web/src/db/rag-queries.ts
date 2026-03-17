import { cosineDistance, desc, gt, sql } from 'drizzle-orm'

import { ragChunk, ragDocument } from './schema'

import { db } from './index'

export async function searchSimilarChunks(queryEmbedding: number[], userId: string, topK = 5) {
  const similarity = sql<number>`1 - (${cosineDistance(ragChunk.embedding, queryEmbedding)})`

  return db
    .select({
      content: ragChunk.content,
      similarity,
      documentName: ragDocument.name,
    })
    .from(ragChunk)
    .innerJoin(ragDocument, sql`${ragChunk.documentId} = ${ragDocument.id}`)
    .where(
      sql`${ragDocument.userId} = ${userId} AND ${ragDocument.status} = 'ready' AND ${gt(similarity, 0.5)}`,
    )
    .orderBy(desc(similarity))
    .limit(topK)
}
