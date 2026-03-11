import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

import { getMessagesByChatId, getChatById } from '@/db/chat-queries'
import { ChatPage } from '@/features/chat/chat-page'
import { AppSidebar } from '@/features/chat/components/app-sidebar'

import type { ChatMessage } from '@/db/chat-queries'
import type { UIMessage } from 'ai'

function toUIMessages(messages: ChatMessage[]): UIMessage[] {
  return messages.map((m) => ({
    id: m.id,
    role: m.role as UIMessage['role'],
    parts: m.parts as UIMessage['parts'],
    metadata: {},
  }))
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const chat = await getChatById(id)

  if (!chat) notFound()

  const [messages, cookieStore] = await Promise.all([
    getMessagesByChatId(id),
    cookies(),
  ])
  const sidebarDefaultOpen = cookieStore.get('sidebar_state')?.value === 'true'

  return (
    <ChatPage
      sidebar={<AppSidebar />}
      chatId={id}
      initialMessages={toUIMessages(messages)}
      sidebarDefaultOpen={sidebarDefaultOpen}
    />
  )
}
