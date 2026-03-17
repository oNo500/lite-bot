import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'

import { appPaths } from '@/config/app-paths'
import { db } from '@/db/index'
import { ragDocument } from '@/db/schema'
import { auth } from '@/lib/auth'
import { ChatError } from '@/lib/errors'

const SUPPORTED_MIME_TYPES = new Set(['text/plain', 'text/markdown', 'application/pdf'])
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function GET(_req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return new ChatError('Unauthorized', 401).toResponse()

  const docs = await db
    .select()
    .from(ragDocument)
    .where(eq(ragDocument.userId, session.user.id))
    .orderBy(ragDocument.createdAt)

  return Response.json(docs)
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return new ChatError('Unauthorized', 401).toResponse()

  const formData = await req.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return new ChatError('Bad Request', 400).toResponse()
  }

  if (!SUPPORTED_MIME_TYPES.has(file.type)) {
    return Response.json({ error: 'Unsupported file type' }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return Response.json({ error: 'File too large (max 10MB)' }, { status: 400 })
  }

  const [doc] = await db
    .insert(ragDocument)
    .values({
      userId: session.user.id,
      name: file.name,
      mimeType: file.type,
      size: file.size,
      status: 'pending',
    })
    .returning()

  // Store file content in memory and trigger ingest asynchronously
  const content = await file.text()

  // Kick off background ingest (fire-and-forget, client polls status)
  const ingestUrl = new URL(appPaths.api.rag.ingest.href(doc!.id), req.url)
  fetch(ingestUrl.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  }).catch(() => {
    // Background task, ignore connection errors
  })

  return Response.json(doc, { status: 201 })
}
