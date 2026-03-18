import {
  createIdGenerator,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
} from 'ai'

import { ensureChat, saveMessages } from '@/db/chat-queries'
import { model } from '@/lib/ai/provider'
import { createEventWriter } from '@/lib/ai/stream-events'
import { aiTools } from '@/lib/ai/tools'
import { buildRagSystemPrompt } from '@/lib/rag/retrieve'

import { generateChatTitle } from '../actions'
import { prepareModelMessages } from './prepare-model-messages'

import type { AppUIMessage } from '@/lib/ai/stream-events'
import type { UIMessage } from 'ai'

interface AuthenticatedChatParams {
  chatId: string
  messages: UIMessage[]
  userId: string
  useRag: boolean
}

interface EphemeralChatParams {
  messages: UIMessage[]
  useRag: boolean
}

function getLastUserText(messages: UIMessage[]): string {
  const lastUserMsg = messages.toReversed().find((m) => m.role === 'user')
  const firstTextPart = lastUserMsg?.parts.find((p) => p.type === 'text')
  return firstTextPart && 'text' in firstTextPart ? String(firstTextPart.text) : ''
}

async function buildSystemPrompt(useRag: boolean, text: string, userId?: string): Promise<string> {
  if (useRag && userId) {
    return buildRagSystemPrompt(text, userId)
  }
  return 'You are a helpful assistant.'
}

export async function streamAuthenticatedChat({
  chatId,
  messages,
  userId,
  useRag,
}: AuthenticatedChatParams): Promise<Response> {
  const { isNew, userId: chatOwnerId } = await ensureChat(userId, chatId)
  if (!isNew && chatOwnerId !== userId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const lastUserMessage = messages.toReversed().find((m) => m.role === 'user')
  if (lastUserMessage) {
    await saveMessages([{
      id: lastUserMessage.id,
      chatId,
      role: lastUserMessage.role,
      parts: lastUserMessage.parts,
      attachments: [],
    }])
  }

  const text = getLastUserText(messages)
  const userMsgCount = messages.filter((m) => m.role === 'user').length
  const systemPrompt = await buildSystemPrompt(useRag, text, userId)

  const stream = createUIMessageStream<AppUIMessage>({
    originalMessages: messages as AppUIMessage[],
    generateId: createIdGenerator({ prefix: 'msg', size: 16 }),
    execute: async ({ writer }) => {
      const events = createEventWriter(writer)

      const result = streamText({
        model,
        system: systemPrompt,
        messages: await prepareModelMessages(messages),
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
        parts: responseMessage.parts,
        attachments: [],
      }])
    },
  })

  return createUIMessageStreamResponse({ stream })
}

export async function streamEphemeralChat({
  messages,
  useRag,
}: EphemeralChatParams): Promise<Response> {
  const text = getLastUserText(messages)
  const systemPrompt = await buildSystemPrompt(useRag, text)

  const stream = createUIMessageStream<AppUIMessage>({
    originalMessages: messages as AppUIMessage[],
    generateId: createIdGenerator({ prefix: 'msg', size: 16 }),
    execute: async ({ writer }) => {
      const result = streamText({
        model,
        system: systemPrompt,
        messages: await prepareModelMessages(messages),
        tools: aiTools,
        stopWhen: stepCountIs(5),
      })

      writer.merge(result.toUIMessageStream())
    },
  })

  return createUIMessageStreamResponse({ stream })
}
