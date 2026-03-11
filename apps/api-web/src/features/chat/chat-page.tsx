'use client'

import { useChat } from '@ai-sdk/react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@workspace/ui/components/breadcrumb'
import {
  SidebarInset,
  SidebarProvider,
  useSidebar,
} from '@workspace/ui/components/sidebar'
import { DefaultChatTransport } from 'ai'
import { useMemo } from 'react'

import { appPaths } from '@/config/app-paths'

import { ChatInput } from './components/chat-input'
import { ChatMessages } from './components/chat-messages'

import type { FileUIPart, TextUIPart, UIMessage } from 'ai'
import type { ReactNode } from 'react'

interface ChatPageProps {
  sidebar: ReactNode
  chatId: string
  initialMessages?: UIMessage[]
}

function ChatLayout({ messages, onSend, onStop, status }: {
  messages: ReturnType<typeof useChat>['messages']
  onSend: (parts: (TextUIPart | FileUIPart)[]) => void
  onStop: () => void
  status: ReturnType<typeof useChat>['status']
}) {
  const { state, isMobile } = useSidebar()
  const sidebarLeft = isMobile
    ? '0px'
    : (state === 'expanded'
        ? 'var(--sidebar-width)'
        : 'var(--sidebar-width-icon)')

  return (
    <SidebarInset>
      <header
        className="fixed top-0 right-0 z-[9] flex h-14 items-center justify-center bg-background transition-[left] duration-200 ease-linear"
        style={{ left: sidebarLeft }}
      >
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>New Chat</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      {messages.length === 0
        ? (
            <div className="flex min-h-svh items-center justify-center pt-14">
              <div className="w-full max-w-[760px]">
                <ChatInput onSend={onSend} onStop={onStop} status={status} />
              </div>
            </div>
          )
        : (
            <>
              <div className="min-h-svh pt-14 pb-36">
                <div className="mx-auto w-full max-w-190">
                  <ChatMessages messages={messages} />
                </div>
              </div>
              <div
                className="fixed right-0 bottom-0 z-[9] flex justify-center bg-background transition-[left] duration-200 ease-linear"
                style={{ left: sidebarLeft }}
              >
                <div className="w-full max-w-190">
                  <ChatInput onSend={onSend} onStop={onStop} status={status} />
                </div>
              </div>
            </>
          )}
    </SidebarInset>
  )
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

  const { messages, sendMessage, stop, status } = useChat({
    id: chatId,
    messages: initialMessages,
    transport,
    onFinish: () => {
      if (isNewChat) {
        globalThis.history.replaceState(null, '', appPaths.chat.detail.href(chatId))
      }
    },
  })

  function handleSend(parts: (TextUIPart | FileUIPart)[]) {
    void sendMessage({ parts })
  }

  return (
    <SidebarProvider defaultOpen={false}>
      {sidebar}
      <ChatLayout messages={messages} onSend={handleSend} onStop={stop} status={status} />
    </SidebarProvider>
  )
}
