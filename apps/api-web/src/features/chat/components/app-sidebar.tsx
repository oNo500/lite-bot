import { Sidebar, SidebarRail } from '@workspace/ui/components/sidebar'
import { headers } from 'next/headers'

import { getChatsByUserId } from '@/db/chat-queries'
import { auth } from '@/lib/auth'

import { ChatHistory } from './chat-history'
import { NavSecondary } from './nav-secondary'
import { AppSidebarHeader } from './sidebar-header'

export async function AppSidebar() {
  const session = await auth.api.getSession({ headers: await headers() })

  const chats = session?.user ? await getChatsByUserId(session.user.id) : []

  return (
    <Sidebar className="border-r-0">
      <AppSidebarHeader />
      <ChatHistory chats={chats} />
      <NavSecondary className="mt-auto" />
      <SidebarRail />
    </Sidebar>
  )
}
