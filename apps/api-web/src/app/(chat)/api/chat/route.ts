import { checkBotId } from 'botid/server'

import { streamChat } from '@/features/chat/mutations/stream-chat'
import { withAuth } from '@/lib/api/with-auth'
import { withErrorHandler } from '@/lib/api/with-error-handler'
import { ChatError } from '@/lib/errors'
import { checkRateLimit } from '@/lib/ratelimit'

import { DEFAULT_FLOW } from './_lib/default-flow'
import { bodySchema } from './_lib/validate-request'

import type { UIMessage } from 'ai'

function getLastUserText(messages: UIMessage[]): string {
  const lastUser = messages.toReversed().find((m) => m.role === 'user')
  const firstText = lastUser?.parts.find((p) => p.type === 'text')
  return firstText && 'text' in firstText ? String(firstText.text) : ''
}

export const POST = withErrorHandler(withAuth(async (req, { auth }) => {
  const botResult = await checkBotId()
  if (botResult.isBot && !botResult.isVerifiedBot) {
    return new ChatError('Forbidden', 403).toResponse()
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
  const { allowed } = await checkRateLimit(ip)
  if (!allowed) return new ChatError('Too Many Requests', 429).toResponse()

  const parsed = bodySchema.parse(await req.json())
  const messages = parsed.messages as UIMessage[]
  const query = getLastUserText(messages)

  const isAnonymous = auth.session.user.isAnonymous ?? false
  const userId = isAnonymous ? undefined : auth.session.user.id
  const chatId = isAnonymous ? undefined : parsed.chatId

  return streamChat({ flow: DEFAULT_FLOW, messages, query, userId, chatId })
}))
