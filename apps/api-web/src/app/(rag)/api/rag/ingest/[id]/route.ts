import { eq } from 'drizzle-orm'

import { db } from '@/db/index'
import { ragChunk, ragDocument } from '@/db/schema'
import { chunkText } from '@/lib/rag/chunk'
import { embedTexts } from '@/lib/rag/embed'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { content, mimeType } = await req.json() as { content: string, mimeType: string }

  await db
    .update(ragDocument)
    .set({ status: 'processing' })
    .where(eq(ragDocument.id, id))

  try {
    const chunks
      = mimeType === 'application/json'
        ? (JSON.parse(content) as unknown[]).map((record) => JSON.stringify(record))
        : chunkText(content)

    const embeddings = await embedTexts(chunks)

    const chunkRows = chunks.map((text, i) => ({
      documentId: id,
      content: text,
      embedding: embeddings[i]!,
      chunkIndex: i,
    }))

    await db.insert(ragChunk).values(chunkRows)
    await db
      .update(ragDocument)
      .set({ status: 'ready' })
      .where(eq(ragDocument.id, id))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    await db
      .update(ragDocument)
      .set({ status: 'error', errorMessage: message })
      .where(eq(ragDocument.id, id))
  }

  return new Response(null, { status: 204 })
}
