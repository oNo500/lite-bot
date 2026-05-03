import { eq } from "drizzle-orm";

import { db } from "@/db";
import { ragChunk, ragDocument } from "@/db/schema";
import { chunkText } from "@/lib/rag/chunk";
import { embedTexts } from "@/lib/rag/embed";

import type { Chunk, ChunkConfig } from "@/lib/rag/types";

const DEFAULT_CHUNK_CONFIG: ChunkConfig = { strategy: "fixed", size: 512, overlap: 64 };

interface IngestDocumentParams {
  documentId: string;
  content: string;
  mimeType: string;
}

export async function ingestDocument(params: IngestDocumentParams): Promise<void> {
  const { documentId, content, mimeType } = params;
  const chunkConfig = DEFAULT_CHUNK_CONFIG;

  await db
    .update(ragDocument)
    .set({ status: "processing", rawContent: content, chunkConfig })
    .where(eq(ragDocument.id, documentId));

  try {
    const chunks =
      mimeType === "application/json"
        ? jsonRecordsAsChunks(content)
        : chunkText(content, chunkConfig);

    if (chunks.length === 0) {
      await db.update(ragDocument).set({ status: "ready" }).where(eq(ragDocument.id, documentId));
      return;
    }

    const embeddings = await embedTexts(chunks.map((c) => c.content));

    const rows = chunks.map((chunk, i) => ({
      documentId,
      content: chunk.content,
      embedding: embeddings[i]!,
      chunkIndex: i,
      charStart: chunk.charStart,
      charEnd: chunk.charEnd,
      tokenCount: chunk.tokenCount,
    }));

    await db.insert(ragChunk).values(rows);
    await db.update(ragDocument).set({ status: "ready" }).where(eq(ragDocument.id, documentId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await db
      .update(ragDocument)
      .set({ status: "error", errorMessage: message })
      .where(eq(ragDocument.id, documentId));
  }
}

function jsonRecordsAsChunks(content: string): Chunk[] {
  const records = JSON.parse(content) as unknown[];
  let cursor = 0;
  return records.map((record) => {
    const text = JSON.stringify(record);
    const charStart = cursor;
    const charEnd = cursor + text.length;
    cursor = charEnd;
    return { content: text, charStart, charEnd, tokenCount: Math.ceil(text.length / 4) };
  });
}
