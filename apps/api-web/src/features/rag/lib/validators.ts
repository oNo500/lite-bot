import { z } from "zod";

export const SUPPORTED_MIME_TYPES = [
  "text/plain",
  "text/markdown",
  "application/pdf",
  "application/json",
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const ingestBodySchema = z.object({
  content: z.string(),
  mimeType: z.enum(SUPPORTED_MIME_TYPES),
});

export const documentIdParamsSchema = z.object({
  id: z.uuid(),
});

export const chunkIdParamsSchema = z.object({
  id: z.uuid(),
});

export const updateChunkSchema = z.object({
  enabled: z.boolean().optional(),
  editedContent: z.string().nullable().optional(),
});

export const rechunkConfigSchema = z.object({
  strategy: z.enum(["fixed", "semantic"]),
  size: z.number().int().positive(),
  overlap: z.number().int().min(0),
});
