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
import { useMemo } from 'react'

import { appPaths } from '@/config/app-paths'

import { ChatInput } from './components/chat-input'
import { ChatMessages } from './components/chat-messages'

import type { UIMessage } from 'ai'
import type { ReactNode } from 'react'

interface ChatPageProps {
  sidebar: ReactNode
  chatId: string
  initialMessages?: UIMessage[]
}

export function ChatPage({ sidebar, chatId, initialMessages }: ChatPageProps) {
  const isNewChat = !initialMessages?.length

  const transport = useMemo(
    () => new DefaultChatTransport({
      api: '/api/chat',
      prepareSendMessagesRequest: ({ id, messages }) => ({
        body: { chatId: id, messages },
      }),
    }),
    [],
  )

  const { messages, sendMessage, status } = useChat({
    id: chatId,
    messages: initialMessages,
    transport,
    onFinish: () => {
      if (isNewChat) {
        globalThis.history.replaceState(null, '', appPaths.chat.detail.href(chatId))
      }
    },
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
