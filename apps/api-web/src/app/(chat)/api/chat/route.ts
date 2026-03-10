import { createDeepSeek } from '@ai-sdk/deepseek'
import { devToolsMiddleware } from '@ai-sdk/devtools'
import { streamText, convertToModelMessages, wrapLanguageModel } from 'ai'
import { headers } from 'next/headers'
import { z } from 'zod'

import { env } from '@/config/env'
import { createChat, saveMessages, getChatById } from '@/db/chat-queries'
import { auth } from '@/lib/auth'

import type { UIMessage } from 'ai'

const deepseek = createDeepSeek({ apiKey: env.DEEPSEEK_API_KEY })

const baseModel = deepseek('deepseek-chat')

const model
  = process.env.NODE_ENV === 'development'
    ? wrapLanguageModel({ model: baseModel, middleware: devToolsMiddleware() })
    : baseModel

const bodySchema = z.object({
  messages: z.array(z.custom<UIMessage>()),
  chatId: z.string().uuid({ message: 'Invalid chat ID' }).optional(),
})

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return new Response('Unauthorized', { status: 401 })

  const parsed = bodySchema.safeParse(await req.json())
  if (!parsed.success) return new Response('Bad Request', { status: 400 })

  const { messages, chatId: incomingChatId } = parsed.data

  let chatId = incomingChatId

  if (chatId) {
    const existing = await getChatById(chatId)
    if (existing?.userId !== session.user.id) {
      return new Response('Forbidden', { status: 403 })
    }
  } else {
    const firstUserMessage = messages.find((m) => m.role === 'user')
    const firstTextPart = firstUserMessage?.parts.find((p) => p.type === 'text')
    const title = firstTextPart && 'text' in firstTextPart
      ? String(firstTextPart.text).slice(0, 50)
      : 'New Chat'
    const newChat = await createChat(session.user.id, title)
    chatId = newChat.id
  }

  const userMessages = messages.filter((m) => m.role === 'user')
  await saveMessages(
    userMessages.map((m) => ({
      chatId: chatId,
      role: m.role,
      parts: m.parts as unknown[],
      attachments: [],
    })),
  )

  const result = streamText({
    model,
    messages: await convertToModelMessages(messages),
    onFinish: async ({ response }) => {
      const assistantMessages = response.messages.filter((m) => m.role === 'assistant')
      await saveMessages(
        assistantMessages.map((m) => ({
          chatId: chatId,
          role: m.role,
          parts: m.content as unknown[],
          attachments: [],
        })),
      )
    },
  })

  const response = result.toUIMessageStreamResponse()
  const newHeaders = new Headers(response.headers)
  newHeaders.set('X-Chat-Id', chatId)

  return new Response(response.body, {
    status: response.status,
    headers: newHeaders,
  })
}
