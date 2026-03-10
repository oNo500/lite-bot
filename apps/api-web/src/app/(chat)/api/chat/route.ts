import { createDeepSeek } from '@ai-sdk/deepseek'
import { devToolsMiddleware } from '@ai-sdk/devtools'
import { convertToModelMessages, streamText, wrapLanguageModel } from 'ai'
import { checkBotId } from 'botid/server'
import { headers } from 'next/headers'
import { after } from 'next/server'
import { z } from 'zod'

import { env } from '@/config/env'
import { createChat, getChatById, saveMessages } from '@/db/chat-queries'
import { generateChatTitle } from '@/features/chat/actions'
import { auth } from '@/lib/auth'
import { ChatError } from '@/lib/errors'
import { checkRateLimit } from '@/lib/ratelimit'

import type { UIMessage } from 'ai'

const deepseek = createDeepSeek({ apiKey: env.DEEPSEEK_API_KEY })
const baseModel = deepseek('deepseek-chat')
const model
  = env.NODE_ENV === 'development'
    ? wrapLanguageModel({ model: baseModel, middleware: devToolsMiddleware() })
    : baseModel

const bodySchema = z.object({
  messages: z.array(z.custom<UIMessage>()),
  chatId: z.uuid().optional(),
})

export async function POST(req: Request) {
  // Bot 检测（Vercel 环境，从请求头读取）
  const botResult = await checkBotId()
  if (botResult.isBot && !botResult.isVerifiedBot) {
    return new ChatError('Forbidden', 403).toResponse()
  }

  // 认证
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return new ChatError('Unauthorized', 401).toResponse()

  // IP 速率限制
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
  const { allowed } = await checkRateLimit(ip)
  if (!allowed) return new ChatError('Too Many Requests', 429).toResponse()

  // 请求体解析
  const parsed = bodySchema.safeParse(await req.json())
  if (!parsed.success) return new ChatError('Bad Request', 400).toResponse()

  const { messages, chatId: incomingChatId } = parsed.data
  let chatId = incomingChatId
  let isNewChat = false

  if (chatId) {
    const existing = await getChatById(chatId)
    if (existing) {
      if (existing.userId !== session.user.id) {
        return new ChatError('Forbidden', 403).toResponse()
      }
    } else {
      await createChat(session.user.id, 'New Chat', chatId)
      isNewChat = true
    }
  } else {
    const newChat = await createChat(session.user.id, 'New Chat')
    chatId = newChat.id
    isNewChat = true
  }

  const userMessages = messages.filter((m) => m.role === 'user')
  await saveMessages(
    userMessages.map((m) => ({
      id: m.id,
      chatId: chatId,
      role: m.role,
      parts: m.parts as unknown[],
      attachments: [],
    })),
  )

  const result = streamText({
    model,
    messages: await convertToModelMessages(messages),
  })

  const response = result.toUIMessageStreamResponse({
    onFinish: async ({ messages: updatedMessages }) => {
      const assistantMessages = updatedMessages.filter((m) => m.role === 'assistant')
      await saveMessages(
        assistantMessages.map((m) => ({
          id: m.id,
          chatId: chatId,
          role: m.role,
          parts: m.parts as unknown[],
          attachments: [],
        })),
      )

      if (isNewChat) {
        const firstUserMsg = messages.find((m) => m.role === 'user')
        const firstTextPart = firstUserMsg?.parts.find((p) => p.type === 'text')
        const text
          = firstTextPart && 'text' in firstTextPart ? String(firstTextPart.text) : ''
        if (text) {
          after(generateChatTitle(chatId, text))
        }
      }
    },
  })

  return response
}
