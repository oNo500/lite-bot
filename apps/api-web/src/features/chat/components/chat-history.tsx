'use client'

import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@workspace/ui/components/sidebar'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { appPaths } from '@/config/app-paths'

import type { Chat } from '@/db/chat-queries'

export function ChatHistory({ chats }: { chats: Chat[] }) {
  const pathname = usePathname()

  if (chats.length === 0) {
    return (
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <p className="px-3 py-4 text-xs text-muted-foreground">No conversations yet.</p>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    )
  }

  return (
    <SidebarContent>
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>Recents</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {chats.toReversed().map((chat) => (
              <SidebarMenuItem key={chat.id}>
                <SidebarMenuButton
                  isActive={pathname === appPaths.chat.detail.href(chat.id)}
                  render={<Link href={appPaths.chat.detail.href(chat.id)} />}
                >
                  <span className="truncate">{chat.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  )
}
