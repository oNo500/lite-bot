"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { appPaths } from "@/config/app-paths";

import type { ChunkConfig } from "@/lib/rag/types";

export interface ChunkListItem {
  id: string;
  chunkIndex: number;
  content: string;
  editedContent: string | null;
  charStart: number;
  charEnd: number;
  tokenCount: number;
  enabled: boolean;
}

export interface DocumentChunksResult {
  document: {
    id: string;
    name: string;
    rawContent: string | null;
    chunkConfig: ChunkConfig | null;
  };
  chunks: ChunkListItem[];
}

function chunksKey(documentId: string) {
  return ["rag-document-chunks", documentId] as const;
}

async function fetchDocumentChunks(documentId: string): Promise<DocumentChunksResult> {
  const res = await fetch(appPaths.api.rag.documentChunks.href(documentId));
  if (!res.ok) throw new Error("Failed to fetch document chunks");
  return res.json() as Promise<DocumentChunksResult>;
}

export function useDocumentChunks(documentId: string) {
  return useQuery({
    queryKey: chunksKey(documentId),
    queryFn: () => fetchDocumentChunks(documentId),
  });
}

export interface UpdateChunkPatch {
  enabled?: boolean;
  editedContent?: string | null;
}

export function useUpdateChunk(documentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { chunkId: string; patch: UpdateChunkPatch }) => {
      const res = await fetch(appPaths.api.rag.chunk.href(params.chunkId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params.patch),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({ error: "Update failed" }))) as {
          error?: string;
        };
        throw new Error(err.error ?? "Update failed");
      }
      return res.json() as Promise<ChunkListItem>;
    },
    onMutate: async ({ chunkId, patch }) => {
      // Optimistic update only when toggling enabled (fast path)
      if (patch.enabled === undefined || patch.editedContent !== undefined) return undefined;
      await queryClient.cancelQueries({ queryKey: chunksKey(documentId) });
      const prev = queryClient.getQueryData<DocumentChunksResult>(chunksKey(documentId));
      if (prev) {
        queryClient.setQueryData<DocumentChunksResult>(chunksKey(documentId), {
          ...prev,
          chunks: prev.chunks.map((c) =>
            c.id === chunkId ? { ...c, enabled: patch.enabled! } : c,
          ),
        });
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      const prev = (ctx as { prev?: DocumentChunksResult } | undefined)?.prev;
      if (prev) queryClient.setQueryData(chunksKey(documentId), prev);
    },
    onSuccess: (updated) => {
      // Pessimistic merge for editedContent path
      const prev = queryClient.getQueryData<DocumentChunksResult>(chunksKey(documentId));
      if (prev) {
        queryClient.setQueryData<DocumentChunksResult>(chunksKey(documentId), {
          ...prev,
          chunks: prev.chunks.map((c) => (c.id === updated.id ? updated : c)),
        });
      }
    },
  });
}

export function useRechunkDocument(documentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: ChunkConfig) => {
      const res = await fetch(appPaths.api.rag.documentRechunk.href(documentId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({ error: "Re-chunk failed" }))) as {
          error?: string;
        };
        throw new Error(err.error ?? "Re-chunk failed");
      }
      return res.json() as Promise<{ ok: true }>;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chunksKey(documentId) });
    },
  });
}
