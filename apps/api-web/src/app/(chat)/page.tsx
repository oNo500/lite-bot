import { randomUUID } from 'node:crypto'

import { ChatPage } from '@/features/chat/chat-page'

export default function Page() {
  return <ChatPage chatId={randomUUID()} />
}
