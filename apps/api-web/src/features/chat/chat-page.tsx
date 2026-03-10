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

import { ChatInput } from './components/chat-input'
import { ChatMessages } from './components/chat-messages'

import type { ReactNode } from 'react'

export function ChatPage({ sidebar }: { sidebar: ReactNode }) {
  const { messages, sendMessage, status } = useChat()

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
