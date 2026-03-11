import { createIdGenerator, convertToModelMessages, streamText } from 'ai'
import { checkBotId } from 'botid/server'
import { headers } from 'next/headers'
import { after } from 'next/server'
import { z } from 'zod'

import { ensureChat, saveMessages } from '@/db/chat-queries'
import { generateChatTitle } from '@/features/chat/actions'
import { model } from '@/lib/ai/provider'
import { auth } from '@/lib/auth'
import { ChatError } from '@/lib/errors'
import { checkRateLimit } from '@/lib/ratelimit'

import type { UIMessage } from 'ai'

const bodySchema = z.object({
  messages: z.array(z.custom<UIMessage>()),
  chatId: z.uuid(),
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

  const { messages, chatId } = parsed.data
  if (!chatId) return new ChatError('Bad Request', 400).toResponse()

  const { isNew, userId: chatOwnerId } = await ensureChat(session.user.id, chatId)
  if (!isNew && chatOwnerId !== session.user.id) {
    return new ChatError('Forbidden', 403).toResponse()
  }

  const lastUserMessage = messages.toReversed().find((m) => m.role === 'user')
  if (lastUserMessage) {
    await saveMessages([{
      id: lastUserMessage.id,
      chatId: chatId,
      role: lastUserMessage.role,
      parts: lastUserMessage.parts as unknown[],
      attachments: [],
    }])
  }

  const result = streamText({
    model,
    messages: await convertToModelMessages(messages),
  })

  const response = result.toUIMessageStreamResponse({
    originalMessages: messages,
    generateMessageId: createIdGenerator({ prefix: 'msg', size: 16 }),
    onFinish: async ({ responseMessage }) => {
      await saveMessages([{
        id: responseMessage.id,
        chatId: chatId,
        role: responseMessage.role,
        parts: responseMessage.parts as unknown[],
        attachments: [],
      }])

      if (isNew) {
        const lastUserMsg = messages.toReversed().find((m) => m.role === 'user')
        const firstTextPart = lastUserMsg?.parts.find((p) => p.type === 'text')
        const text
          = firstTextPart && 'text' in firstTextPart ? String(firstTextPart.text) : ''
        const userMsgCount = messages.filter((m) => m.role === 'user').length
        if (text && userMsgCount === 1) {
          after(generateChatTitle(chatId, text))
        }
      }
    },
  })

  return response
}
