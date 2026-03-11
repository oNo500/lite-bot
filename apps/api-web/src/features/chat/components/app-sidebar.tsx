import {
  Sidebar,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@workspace/ui/components/sidebar'
import { PlusIcon } from 'lucide-react'
import { headers } from 'next/headers'
import Link from 'next/link'

import { appPaths } from '@/config/app-paths'
import { getChatsByUserId } from '@/db/chat-queries'
import { auth } from '@/lib/auth'

import { ChatHistory } from './chat-history'
import { NavSecondary } from './nav-secondary'
import { AppSidebarHeader } from './sidebar-header'

export async function AppSidebar() {
  const session = await auth.api.getSession({ headers: await headers() })

  const chats = session?.user ? await getChatsByUserId(session.user.id) : []

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <AppSidebarHeader />
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton render={<Link href={appPaths.chat.index.href} />} tooltip="New Chat">
                <PlusIcon />
                <span>New Chat</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <ChatHistory chats={chats} />
      <NavSecondary className="mt-auto" />
      <SidebarRail />
    </Sidebar>
  )
}
