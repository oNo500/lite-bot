import { notFound } from 'next/navigation'

import { getMessagesByChatId, getChatById } from '@/db/chat-queries'
import { ChatPage } from '@/features/chat/chat-page'
import { toUIMessages } from '@/features/chat/utils/to-ui-messages'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const chat = await getChatById(id)

  if (!chat) notFound()

  const messages = await getMessagesByChatId(id)

  return <ChatPage chatId={id} initialMessages={toUIMessages(messages)} />
}
