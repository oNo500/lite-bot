import { and, eq } from 'drizzle-orm'
import { headers } from 'next/headers'

import { db } from '@/db/index'
import { ragDocument } from '@/db/schema'
import { auth } from '@/lib/auth'
import { ChatError } from '@/lib/errors'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return new ChatError('Unauthorized', 401).toResponse()

  const { id } = await params

  const [deleted] = await db
    .delete(ragDocument)
    .where(and(eq(ragDocument.id, id), eq(ragDocument.userId, session.user.id)))
    .returning()

  if (!deleted) return new ChatError('Not Found', 404).toResponse()

  return new Response(null, { status: 204 })
}
