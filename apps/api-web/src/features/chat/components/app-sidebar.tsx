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
import Link from 'next/link'
import { Suspense } from 'react'

import { appPaths } from '@/config/app-paths'

import { ChatHistory } from './chat-history'
import { NavSecondary } from './nav-secondary'
import { AppSidebarHeader } from './sidebar-header'

export function AppSidebar() {
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
      <Suspense>
        <ChatHistory />
      </Suspense>
      <NavSecondary className="mt-auto" />
      {/* <SidebarRail /> */}
    </Sidebar>
  )
}
