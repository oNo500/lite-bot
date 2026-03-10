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
import { MessageSquareIcon } from 'lucide-react'
import { usePathname } from 'next/navigation'

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
      <SidebarGroup>
        <SidebarGroupLabel>Chats</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {chats.map((chat) => (
              <SidebarMenuItem key={chat.id}>
                <SidebarMenuButton
                  isActive={pathname === `/chat/${chat.id}`}
                  render={<a href={`/chat/${chat.id}`} />}
                >
                  <MessageSquareIcon />
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
