import type { ChatMessage } from '@/db/chat-queries'
import type { UIMessage } from 'ai'

export function toUIMessages(messages: ChatMessage[]): UIMessage[] {
  return messages.map((m) => ({
    id: m.id,
    role: m.role as UIMessage['role'],
    parts: m.parts as UIMessage['parts'],
    metadata: {},
  }))
}
