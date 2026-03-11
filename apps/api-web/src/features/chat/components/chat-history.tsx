'use client'

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from '@workspace/ui/components/sidebar'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { useInView } from 'motion/react'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { appPaths } from '@/config/app-paths'
import { groupChatsByDate } from '@/features/chat/utils/group-chats-by-date'

import { ChatHistoryItem } from './chat-history-item'

import type { Chat } from '@/db/chat-queries'

interface HistoryPage {
  chats: Chat[]
  hasMore: boolean
}

async function fetchHistory(endingBefore?: string): Promise<HistoryPage> {
  const url = new URL(appPaths.api.history.href, globalThis.location.origin)
  if (endingBefore) url.searchParams.set('ending_before', endingBefore)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error('Failed to fetch history')
  return res.json()
}

export function ChatHistory() {
  const queryClient = useQueryClient()
  const sentinelRef = useRef<HTMLDivElement>(null)
  const inView = useInView(sentinelRef)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } = useInfiniteQuery({
    queryKey: ['chat-history'],
    queryFn: ({ pageParam }) => fetchHistory(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasMore) return
      return lastPage.chats.at(-1)?.id
    },
  })

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  async function handleDelete(chatId: string) {
    const res = await fetch(appPaths.api.history.href, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId }),
    })
    if (!res.ok) throw new Error('Delete failed')
    await queryClient.invalidateQueries({ queryKey: ['chat-history'] })
    toast.success('Conversation deleted')
  }

  if (status === 'pending') {
    return (
      <SidebarContent>
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>History</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="flex flex-col gap-1 px-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full rounded-md" />
              ))}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    )
  }

  if (status === 'error') {
    return (
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <p className="px-3 py-4 text-xs text-muted-foreground">Failed to load conversations.</p>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    )
  }

  const allChats = data.pages.flatMap((p) => p.chats)

  if (allChats.length === 0) {
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

  const groups = groupChatsByDate(allChats)

  return (
    <SidebarContent>
      {groups.map(({ label, chats }) => (
        <SidebarGroup key={label} className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>{label}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {chats.map((chat) => (
                <ChatHistoryItem key={chat.id} chat={chat} onDelete={handleDelete} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}

      <div ref={sentinelRef} className="h-1" />

      {isFetchingNextPage && (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupContent>
            <div className="flex flex-col gap-1 px-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full rounded-md" />
              ))}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      )}
    </SidebarContent>
  )
}
