'use server'

import { createDeepSeek } from '@ai-sdk/deepseek'
import { generateText } from 'ai'

import { env } from '@/config/env'
import { updateChatTitle } from '@/db/chat-queries'

const deepseek = createDeepSeek({ apiKey: env.DEEPSEEK_API_KEY })

export async function generateChatTitle(chatId: string, firstUserMessage: string): Promise<void> {
  const { text } = await generateText({
    model: deepseek('deepseek-chat'),
    prompt: `Summarize the following user message into a concise chat title (max 50 chars, no quotes):\n\n${firstUserMessage}`,
  })
  await updateChatTitle(chatId, text.trim().slice(0, 50))
}
