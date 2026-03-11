import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getChatsByUserIdPaginated, deleteChat } from '@/db/chat-queries'
import { auth } from '@/lib/auth'

const deleteChatSchema = z.object({
  chatId: z.string().uuid(),
})

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const rawLimit = Number(url.searchParams.get('limit') ?? 20)
  const limit = Math.min(Math.max(1, rawLimit), 50)
  const endingBefore = url.searchParams.get('ending_before') ?? undefined

  const chats = await getChatsByUserIdPaginated(session.user.id, limit, endingBefore)
  return NextResponse.json({ chats, hasMore: chats.length === limit })
}

export async function DELETE(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = deleteChatSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid chatId' }, { status: 400 })
  }

  await deleteChat(parsed.data.chatId, session.user.id)
  return new NextResponse(null, { status: 204 })
}
