'use server'

import { generateText } from 'ai'

import { updateChatTitle } from '@/db/chat-queries'
import { model } from '@/lib/ai/provider'

export async function generateChatTitle(chatId: string, firstUserMessage: string): Promise<void> {
  const { text } = await generateText({
    model,
    prompt: `Summarize the following user message into a concise chat title (max 50 chars, no quotes):\n\n${firstUserMessage}`,
  })
  await updateChatTitle(chatId, text.trim().slice(0, 50))
}
