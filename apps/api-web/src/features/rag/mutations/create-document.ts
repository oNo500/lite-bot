import { db } from "@/db";
import { ragDocument } from "@/db/schema";

interface CreateDocumentParams {
  userId: string;
  name: string;
  mimeType: string;
  size: number;
}

export async function createDocument(params: CreateDocumentParams) {
  const [doc] = await db
    .insert(ragDocument)
    .values({
      userId: params.userId,
      name: params.name,
      mimeType: params.mimeType,
      size: params.size,
      status: "pending",
    })
    .returning();

  return doc!;
}
