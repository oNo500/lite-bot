import { eq } from 'drizzle-orm'

import { db } from '@/db'

import { chat, chatMessage } from './schema'

import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'

export type Chat = InferSelectModel<typeof chat>
export type ChatMessage = InferSelectModel<typeof chatMessage>
export type NewChatMessage = InferInsertModel<typeof chatMessage>

export async function createChat(userId: string, title: string): Promise<Chat> {
  const [created] = await db.insert(chat).values({ userId, title }).returning()
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

export async function updateChatTitle(chatId: string, title: string): Promise<void> {
  await db.update(chat).set({ title }).where(eq(chat.id, chatId))
}
