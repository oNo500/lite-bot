import { checkBotId } from 'botid/server'
import { headers } from 'next/headers'

import { auth } from '@/lib/auth'
import { ChatError } from '@/lib/errors'
import { checkRateLimit } from '@/lib/ratelimit'

import { streamAuthenticatedChat, streamEphemeralChat } from './_lib/stream-chat'
import { bodySchema } from './_lib/validate-request'

import type { UIMessage } from 'ai'

export async function POST(req: Request) {
  // Bot 检测
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

  const { messages: rawMessages, chatId, useRag } = parsed.data
  const messages = rawMessages as UIMessage[]

  // 认证/游客分流
  const isAnonymous = session.user.isAnonymous ?? false
  if (isAnonymous) {
    return streamEphemeralChat({ messages, useRag })
  }
  return streamAuthenticatedChat({ chatId, messages, userId: session.user.id, useRag })
}
