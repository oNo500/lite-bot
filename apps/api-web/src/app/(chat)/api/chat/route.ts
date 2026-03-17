import {
  convertToModelMessages,
  createIdGenerator,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
} from 'ai'
import { checkBotId } from 'botid/server'
import { headers } from 'next/headers'
import { z } from 'zod'

import { ensureChat, saveMessages } from '@/db/chat-queries'
import { model } from '@/lib/ai/provider'
import { createEventWriter } from '@/lib/ai/stream-events'
import { aiTools } from '@/lib/ai/tools'
import { auth } from '@/lib/auth'
import { ChatError } from '@/lib/errors'
import { buildRagSystemPrompt } from '@/lib/rag/retrieve'
import { checkRateLimit } from '@/lib/ratelimit'

import { generateChatTitle } from './actions'

import type { AppUIMessage } from '@/lib/ai/stream-events'
import type { UIMessage } from 'ai'

const filePartSchema = z.object({
  type: z.literal('file'),
  url: z.url().refine((u) => u.startsWith('https://'), 'Only https URLs allowed'),
  mediaType: z.enum(['image/jpeg', 'image/png']),
  filename: z.string().optional(),
})

const messagePartSchema = z.union([
  z.object({ type: z.literal('text'), text: z.string() }),
  filePartSchema,
  z.looseObject({ type: z.string() }),
])

const uiMessageSchema = z.looseObject({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system', 'tool']),
  parts: z.array(messagePartSchema),
})

const bodySchema = z.object({
  messages: z.array(uiMessageSchema),
  chatId: z.uuid(),
  useRag: z.boolean().optional().default(false),
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

  const { messages, chatId, useRag } = parsed.data as { messages: UIMessage[], chatId: string, useRag: boolean }
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

  const lastUserMsg = messages.toReversed().find((m) => m.role === 'user')
  const firstTextPart = lastUserMsg?.parts.find((p) => p.type === 'text')
  const text = firstTextPart && 'text' in firstTextPart ? String(firstTextPart.text) : ''
  const userMsgCount = messages.filter((m) => m.role === 'user').length

  const systemPrompt = useRag
    ? await buildRagSystemPrompt(text, session.user.id)
    : 'You are a helpful assistant.'

  const stream = createUIMessageStream<AppUIMessage>({
    originalMessages: messages as AppUIMessage[],
    generateId: createIdGenerator({ prefix: 'msg', size: 16 }),
    execute: async ({ writer }) => {
      const events = createEventWriter(writer)

      const result = streamText({
        model,
        system: systemPrompt,
        messages: await convertToModelMessages(messages),
        tools: aiTools,
        stopWhen: stepCountIs(5),
        onFinish: async () => {
          if (isNew && userMsgCount === 1 && text) {
            const title = await generateChatTitle(chatId, text)
            events.writeChatTitle(title)
          }
        },
      })

      writer.merge(result.toUIMessageStream())
    },
    onFinish: async ({ responseMessage }) => {
      await saveMessages([{
        id: responseMessage.id,
        chatId,
        role: responseMessage.role,
        parts: responseMessage.parts as unknown[],
        attachments: [],
      }])
    },
  })

  return createUIMessageStreamResponse({ stream })
}
