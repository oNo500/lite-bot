import { notFound } from 'next/navigation'

import { getMessagesByChatId, getChatById } from '@/db/chat-queries'
import { ChatPage } from '@/features/chat/chat-page'
import { toUIMessages } from '@/features/chat/utils/to-ui-messages'

const UUID_RE = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (!UUID_RE.test(id)) notFound()

  const chat = await getChatById(id)

  if (!chat) notFound()

  const messages = await getMessagesByChatId(id)

  return <ChatPage chatId={id} initialMessages={toUIMessages(messages)} />
}
