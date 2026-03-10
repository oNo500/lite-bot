'use client'

import { useChat } from '@ai-sdk/react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@workspace/ui/components/breadcrumb'
import { Separator } from '@workspace/ui/components/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@workspace/ui/components/sidebar'
import { DefaultChatTransport } from 'ai'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo } from 'react'

import { appPaths } from '@/config/app-paths'

import { ChatInput } from './components/chat-input'
import { ChatMessages } from './components/chat-messages'

import type { UIMessage } from 'ai'
import type { ReactNode } from 'react'

interface ChatPageProps {
  sidebar: ReactNode
  chatId?: string
  initialMessages?: UIMessage[]
}

export function ChatPage({ sidebar, chatId, initialMessages }: ChatPageProps) {
  const router = useRouter()

  const customFetch = useCallback(async (url: RequestInfo | URL, init?: RequestInit) => {
    const response = await fetch(url, init)
    // 仅新对话（无 chatId）时跳转，跳转后组件被 /chat/[id] 替换，天然只执行一次
    if (!chatId) {
      const newChatId = response.headers.get('X-Chat-Id')
      if (newChatId) {
        router.replace(appPaths.chat.detail.href(newChatId))
      }
    }
    return response
  }, [chatId, router])

  const transport = useMemo(
    () => new DefaultChatTransport({ api: '/api/chat', fetch: customFetch }),
    [customFetch],
  )

  const { messages, sendMessage, status } = useChat({
    id: chatId,
    messages: initialMessages,
    transport,
  })

  function handleSend(text: string) {
    void sendMessage({ text })
  }

  return (
    <SidebarProvider>
      {sidebar}
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 px-3">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-auto" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>New Chat</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-col flex-1 overflow-hidden">
          <ChatMessages messages={messages} />
          <ChatInput onSend={handleSend} isLoading={status === 'streaming' || status === 'submitted'} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
