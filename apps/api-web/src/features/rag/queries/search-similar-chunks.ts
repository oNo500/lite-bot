import { and, cosineDistance, desc, eq, gt, sql } from "drizzle-orm";

import { db } from "@/db";
import { ragChunk, ragDocument } from "@/db/schema";

import type { RagConfig } from "./types";

interface SearchedChunk {
  chunkId: string;
  documentId: string;
  documentName: string;
  content: string;
  charStart: number;
  charEnd: number;
  similarity: number;
}

export async function searchSimilarChunks(
  queryEmbedding: number[],
  userId: string,
  config: RagConfig,
): Promise<SearchedChunk[]> {
  const similarity = sql<number>`1 - (${cosineDistance(ragChunk.embedding, queryEmbedding)})`;
  const content = sql<string>`COALESCE(${ragChunk.editedContent}, ${ragChunk.content})`;

  return db
    .select({
      chunkId: ragChunk.id,
      documentId: ragChunk.documentId,
      documentName: ragDocument.name,
      content,
      charStart: ragChunk.charStart,
      charEnd: ragChunk.charEnd,
      similarity,
    })
    .from(ragChunk)
    .innerJoin(ragDocument, eq(ragChunk.documentId, ragDocument.id))
    .where(
      and(
        eq(ragDocument.userId, userId),
        eq(ragDocument.status, "ready"),
        eq(ragChunk.enabled, true),
        gt(similarity, config.similarityThreshold),
      ),
    )
    .orderBy(desc(similarity))
    .limit(config.topK);
}
