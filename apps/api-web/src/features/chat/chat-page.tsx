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
import { useMemo, useRef, useState } from 'react'

import { StreamEventProvider, useStreamEventDispatch } from '@/components/stream-event-provider'
import { appPaths } from '@/config/app-paths'
import { useChatTitleHandler } from '@/lib/ai/stream-event-handlers'
import { appDataPartSchemas } from '@/lib/ai/stream-events'

import { ChatInput } from './components/chat-input'
import { ChatMessages } from './components/chat-messages'
import { SuggestedActions } from './components/suggested-actions'

import type { AppUIMessage } from '@/lib/ai/stream-events'
import type { FileUIPart, TextUIPart, UIMessage } from 'ai'
import type { ReactNode } from 'react'

interface ChatPageProps {
  sidebar: ReactNode
  chatId: string
  initialMessages?: UIMessage[]
  sidebarDefaultOpen?: boolean
}

function ChatLayout({ messages, onSend, onStop, status, ragEnabled, onRagToggle }: {
  messages: ReturnType<typeof useChat>['messages']
  onSend: (parts: (TextUIPart | FileUIPart)[]) => void
  onStop: () => void
  status: ReturnType<typeof useChat>['status']
  ragEnabled: boolean
  onRagToggle: () => void
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
                <SuggestedActions onSend={onSend} />
                <ChatInput onSend={onSend} onStop={onStop} status={status} ragEnabled={ragEnabled} onRagToggle={onRagToggle} />
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
                <div
                  aria-hidden
                  className="absolute -top-[50px] bottom-0 start-0 z-[-1] h-[100px] w-full pointer-events-none"
                  style={{ background: 'linear-gradient(180deg, color(from var(--background) srgb r g b / 0), color(from var(--background) srgb r g b / 100) 60%)' }}
                />
                <div className="w-full max-w-190">
                  <ChatInput onSend={onSend} onStop={onStop} status={status} ragEnabled={ragEnabled} onRagToggle={onRagToggle} />
                </div>
              </div>
            </>
          )}
    </SidebarInset>
  )
}

function ChatPageInner({ sidebar, chatId, initialMessages, sidebarDefaultOpen = false }: ChatPageProps) {
  const isNewChat = !initialMessages?.length
  const dispatch = useStreamEventDispatch()
  useChatTitleHandler()
  const [ragEnabled, setRagEnabled] = useState(false)
  const ragEnabledRef = useRef(ragEnabled)
  ragEnabledRef.current = ragEnabled

  const transport = useMemo(
    () => new DefaultChatTransport({
      api: '/api/chat',
      prepareSendMessagesRequest: ({ id, messages }) => ({
        body: { chatId: id, messages, useRag: ragEnabledRef.current },
      }),
    }),
    [],
  )

  const { messages, sendMessage, stop, status } = useChat<AppUIMessage>({
    id: chatId,
    messages: initialMessages as AppUIMessage[] | undefined,
    transport,
    dataPartSchemas: appDataPartSchemas,
    onData: dispatch,
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
    <SidebarProvider defaultOpen={sidebarDefaultOpen}>
      {sidebar}
      <ChatLayout
        messages={messages}
        onSend={handleSend}
        onStop={stop}
        status={status}
        ragEnabled={ragEnabled}
        onRagToggle={() => setRagEnabled((v) => !v)}
      />
    </SidebarProvider>
  )
}

export function ChatPage({ sidebar, chatId, initialMessages, sidebarDefaultOpen }: ChatPageProps) {
  return (
    <StreamEventProvider>
      <ChatPageInner sidebar={sidebar} chatId={chatId} initialMessages={initialMessages} sidebarDefaultOpen={sidebarDefaultOpen} />
    </StreamEventProvider>
  )
}
