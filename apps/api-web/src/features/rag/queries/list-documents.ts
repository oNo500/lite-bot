import { eq } from "drizzle-orm";

import { db } from "@/db";
import { ragDocument } from "@/db/schema";

export async function listDocuments(userId: string) {
  return db
    .select()
    .from(ragDocument)
    .where(eq(ragDocument.userId, userId))
    .orderBy(ragDocument.createdAt);
}
