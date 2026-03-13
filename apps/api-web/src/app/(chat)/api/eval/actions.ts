'use server'

import { eq, and } from 'drizzle-orm'
import { headers } from 'next/headers'

import { db } from '@/db'
import { upsertThumbsEval } from '@/db/eval-queries'
import { chatMessage, chat } from '@/db/schema'
import { auth } from '@/lib/auth'

export async function submitThumbsEval(
  messageId: string,
  score: 1 | -1,
): Promise<{ error: string } | void> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return { error: 'Unauthorized' }
  }

  // Verify message belongs to current user via chat ownership
  const [msg] = await db
    .select({ id: chatMessage.id })
    .from(chatMessage)
    .innerJoin(chat, and(eq(chatMessage.chatId, chat.id), eq(chat.userId, session.user.id)))
    .where(eq(chatMessage.id, messageId))

  if (!msg) {
    return { error: 'Forbidden' }
  }

  await upsertThumbsEval(messageId, score)
}
