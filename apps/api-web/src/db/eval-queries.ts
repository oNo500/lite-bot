import { eq } from 'drizzle-orm'

import { db } from '@/db'

import { messageEval } from './schema'

import type { InferSelectModel } from 'drizzle-orm'

export type MessageEval = InferSelectModel<typeof messageEval>

export async function upsertThumbsEval(messageId: string, score: 1 | -1): Promise<void> {
  await db
    .insert(messageEval)
    .values({ messageId, score })
    .onConflictDoUpdate({
      target: messageEval.messageId,
      set: { score, updatedAt: new Date() },
    })
}

export async function getEvalByMessageId(messageId: string): Promise<MessageEval | undefined> {
  const [found] = await db.select().from(messageEval).where(eq(messageEval.messageId, messageId))
  return found
}
