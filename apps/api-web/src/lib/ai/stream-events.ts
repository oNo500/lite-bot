import { z } from "zod";

import type { RetrievedChunk } from "@/features/rag/queries/types";
import type { UIMessage, UIMessageStreamWriter } from "ai";

export type AppStreamEventMap = {
  "chat-title": string;
  "rag-sources": RetrievedChunk[];
} & Record<string, unknown>;

export type AppUIMessage = UIMessage<undefined, AppStreamEventMap>;

export const appDataPartSchemas = {
  "chat-title": z.string(),
  "rag-sources": z.array(
    z.object({
      marker: z.string(),
      chunkId: z.string(),
      documentId: z.string(),
      documentName: z.string(),
      content: z.string(),
      charStart: z.number(),
      charEnd: z.number(),
      similarity: z.number(),
    }),
  ),
} satisfies { [K in keyof AppStreamEventMap]?: z.ZodType<AppStreamEventMap[K]> };

export function createEventWriter(writer: UIMessageStreamWriter) {
  return {
    writeChatTitle(title: string) {
      writer.write({ type: "data-chat-title", data: title, transient: true });
    },
  };
}
