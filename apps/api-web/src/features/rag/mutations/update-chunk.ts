import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { ragChunk, ragDocument } from "@/db/schema";
import { embedTexts } from "@/lib/rag/embed";

import type { ChunkListItem } from "../queries/get-document-chunks";

export interface UpdateChunkPatch {
  enabled?: boolean;
  editedContent?: string | null;
}

export interface UpdateChunkParams {
  chunkId: string;
  userId: string;
  patch: UpdateChunkPatch;
}

export async function updateChunk(params: UpdateChunkParams): Promise<ChunkListItem | null> {
  const { chunkId, userId, patch } = params;

  const [existing] = await db
    .select({
      id: ragChunk.id,
      documentId: ragChunk.documentId,
      content: ragChunk.content,
      editedContent: ragChunk.editedContent,
      chunkIndex: ragChunk.chunkIndex,
      charStart: ragChunk.charStart,
      charEnd: ragChunk.charEnd,
      tokenCount: ragChunk.tokenCount,
      enabled: ragChunk.enabled,
      ownerId: ragDocument.userId,
    })
    .from(ragChunk)
    .innerJoin(ragDocument, eq(ragChunk.documentId, ragDocument.id))
    .where(and(eq(ragChunk.id, chunkId), eq(ragDocument.userId, userId)))
    .limit(1);

  if (!existing) return null;

  const editedContentInPatch = Object.hasOwn(patch, "editedContent");
  const enabledInPatch = Object.hasOwn(patch, "enabled");

  const updates: {
    enabled?: boolean;
    editedContent?: string | null;
    embedding?: number[];
  } = {};

  if (enabledInPatch && patch.enabled !== undefined) {
    updates.enabled = patch.enabled;
  }

  if (editedContentInPatch) {
    const nextEdited = patch.editedContent ?? null;
    const prevEdited = existing.editedContent;
    const effectiveContentChanged = nextEdited !== prevEdited;

    updates.editedContent = nextEdited;

    if (effectiveContentChanged) {
      const effective = nextEdited ?? existing.content;
      const [embedding] = await embedTexts([effective]);
      if (embedding) updates.embedding = embedding;
    }
  }

  if (Object.keys(updates).length === 0) {
    return {
      id: existing.id,
      chunkIndex: existing.chunkIndex,
      content: existing.content,
      editedContent: existing.editedContent,
      charStart: existing.charStart,
      charEnd: existing.charEnd,
      tokenCount: existing.tokenCount,
      enabled: existing.enabled,
    };
  }

  await db.update(ragChunk).set(updates).where(eq(ragChunk.id, chunkId));

  return {
    id: existing.id,
    chunkIndex: existing.chunkIndex,
    content: existing.content,
    editedContent:
      updates.editedContent === undefined ? existing.editedContent : updates.editedContent,
    charStart: existing.charStart,
    charEnd: existing.charEnd,
    tokenCount: existing.tokenCount,
    enabled: updates.enabled ?? existing.enabled,
  };
}
