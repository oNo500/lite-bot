import { randomUUID } from 'node:crypto'

import { cookies } from 'next/headers'

import { ChatPage } from '@/features/chat/chat-page'
import { AppSidebar } from '@/features/chat/components/app-sidebar'

export default async function Page() {
  const cookieStore = await cookies()
  const sidebarDefaultOpen = cookieStore.get('sidebar_state')?.value === 'true'

  return <ChatPage sidebar={<AppSidebar />} chatId={randomUUID()} sidebarDefaultOpen={sidebarDefaultOpen} />
}
