import { and, eq, lt } from 'drizzle-orm'

import { db } from '@/db'

import { chat, chatMessage } from './schema'

import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'

export type Chat = InferSelectModel<typeof chat>
export type ChatMessage = InferSelectModel<typeof chatMessage>
export type NewChatMessage = InferInsertModel<typeof chatMessage>

export async function createChat(userId: string, title: string, id?: string): Promise<Chat> {
  const [created] = await db.insert(chat).values({ ...(id ? { id } : {}), userId, title }).returning()
  if (!created) throw new Error('Failed to create chat')
  return created
}

export async function saveMessages(messages: NewChatMessage[]): Promise<void> {
  if (messages.length === 0) return
  await db.insert(chatMessage).values(messages).onConflictDoNothing()
}

export async function getMessagesByChatId(chatId: string): Promise<ChatMessage[]> {
  return db.select().from(chatMessage).where(eq(chatMessage.chatId, chatId))
}

export async function getChatsByUserId(userId: string): Promise<Chat[]> {
  return db.select().from(chat).where(eq(chat.userId, userId))
}

export async function getChatById(chatId: string): Promise<Chat | undefined> {
  const [found] = await db.select().from(chat).where(eq(chat.id, chatId))
  return found
}

// 原子性确保 chat 存在，返回是否为新建
export async function ensureChat(userId: string, chatId: string): Promise<{ isNew: boolean, userId: string }> {
  const [inserted] = await db
    .insert(chat)
    .values({ id: chatId, userId, title: 'New Chat' })
    .onConflictDoNothing()
    .returning()

  if (inserted) return { isNew: true, userId: inserted.userId }

  const [existing] = await db.select().from(chat).where(eq(chat.id, chatId))
  if (!existing) throw new Error('Chat not found after upsert')
  return { isNew: false, userId: existing.userId }
}

export async function updateChatTitle(chatId: string, title: string): Promise<void> {
  await db.update(chat).set({ title }).where(eq(chat.id, chatId))
}

export async function getChatsByUserIdPaginated(
  userId: string,
  limit: number,
  endingBefore?: string,
): Promise<Chat[]> {
  if (endingBefore) {
    const [cursor] = await db.select({ createdAt: chat.createdAt }).from(chat).where(eq(chat.id, endingBefore))
    if (cursor) {
      return db
        .select()
        .from(chat)
        .where(and(eq(chat.userId, userId), lt(chat.createdAt, cursor.createdAt)))
        .orderBy(chat.createdAt)
        .limit(limit)
    }
  }
  return db.select().from(chat).where(eq(chat.userId, userId)).orderBy(chat.createdAt).limit(limit)
}

export async function deleteChat(chatId: string, userId: string): Promise<void> {
  await db.delete(chat).where(and(eq(chat.id, chatId), eq(chat.userId, userId)))
}
