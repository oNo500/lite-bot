import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { ragDocument } from "@/db/schema";

export async function deleteDocument(documentId: string, userId: string) {
  const [deleted] = await db
    .delete(ragDocument)
    .where(and(eq(ragDocument.id, documentId), eq(ragDocument.userId, userId)))
    .returning();

  return deleted;
}
