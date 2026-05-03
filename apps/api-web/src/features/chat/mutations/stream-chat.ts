import {
  createIdGenerator,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
} from 'ai'

import { prepareModelMessages } from '@/app/(chat)/api/chat/_lib/prepare-model-messages'
import { ensureChat, saveMessages } from '@/db/chat-queries'
import { model as defaultModel } from '@/lib/ai/provider'
import { createEventWriter } from '@/lib/ai/stream-events'

import { runCapabilities } from '../lib/run-capabilities'

import type { ChatFlow } from '../types'
import type { AppUIMessage } from '@/lib/ai/stream-events'
import type { UIMessage } from 'ai'

interface StreamChatParams {
  flow: ChatFlow
  messages: UIMessage[]
  query: string
  userId?: string
  chatId?: string
}

export async function streamChat(params: StreamChatParams): Promise<Response> {
  const { flow, messages, query, userId, chatId } = params

  const persisted = userId !== undefined && chatId !== undefined
  let isNewChat = false

  if (persisted) {
    const ensured = await ensureChat(userId, chatId)
    if (!ensured.isNew && ensured.userId !== userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
    isNewChat = ensured.isNew

    const lastUser = messages.toReversed().find((m) => m.role === 'user')
    if (lastUser) {
      await saveMessages([{
        id: lastUser.id,
        chatId,
        role: 'user',
        parts: lastUser.parts,
        attachments: [],
      }])
    }
  }

  const ctx = await runCapabilities(flow.capabilities, {
    userId,
    chatId,
    query,
    messages,
    systemPrompts: [],
    tools: {},
    metadata: {},
  })

  const system = ctx.systemPrompts.join('\n\n') || 'You are a helpful assistant.'

  const stream = createUIMessageStream<AppUIMessage>({
    originalMessages: messages as AppUIMessage[],
    generateId: createIdGenerator({ prefix: 'msg', size: 16 }),
    execute: async ({ writer }) => {
      for (const entry of flow.capabilities.filter((e) => e.enabled)) {
        if (entry.capability.onStreamStart) {
          await entry.capability.onStreamStart(writer, ctx, entry.config)
        }
      }

      const events = createEventWriter(writer)

      const result = streamText({
        model: defaultModel,
        system,
        messages: await prepareModelMessages(messages),
        tools: ctx.tools,
        stopWhen: stepCountIs(flow.agentLoop.maxSteps),
        onFinish: async () => {
          if (
            persisted
            && isNewChat
            && messages.filter((m) => m.role === 'user').length === 1
            && query
          ) {
            const { generateChatTitle } = await import('@/app/(chat)/api/chat/actions')
            const title = await generateChatTitle(chatId, query)
            events.writeChatTitle(title)
          }
        },
      })

      writer.merge(result.toUIMessageStream())
    },
    onFinish: async ({ responseMessage }) => {
      if (persisted) {
        await saveMessages([{
          id: responseMessage.id,
          chatId,
          role: responseMessage.role,
          parts: responseMessage.parts,
          attachments: [],
        }])
      }
    },
  })

  return createUIMessageStreamResponse({ stream })
}
