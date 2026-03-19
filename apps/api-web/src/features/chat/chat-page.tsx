'use client'

import { useChat } from '@ai-sdk/react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@workspace/ui/components/breadcrumb'
import { SidebarTrigger, useSidebar } from '@workspace/ui/components/sidebar'
import { DefaultChatTransport } from 'ai'
import dynamic from 'next/dynamic'
import { useMemo, useRef, useState } from 'react'

import { PromptInputProvider } from '@/components/ai-elements/prompt-input'
import { StreamEventProvider, useStreamEventDispatch } from '@/components/stream-event-provider'
import { appPaths } from '@/config/app-paths'
import { useChatTitleHandler } from '@/lib/ai/stream-event-handlers'
import { appDataPartSchemas } from '@/lib/ai/stream-events'

import { ChatInput } from './components/chat-input'
import { ChatMessages } from './components/chat-messages'
import { SuggestedActions } from './components/suggested-actions'

const UserMenu = dynamic(() => import('./components/user-menu').then((m) => m.UserMenu), { ssr: false })

import type { AppUIMessage } from '@/lib/ai/stream-events'
import type { FileUIPart, TextUIPart, UIMessage } from 'ai'

interface ChatPageProps {
  chatId: string
  initialMessages?: UIMessage[]
}

function ChatPageInner({ chatId, initialMessages }: ChatPageProps) {
  const isNewChat = !initialMessages?.length
  const dispatch = useStreamEventDispatch()
  useChatTitleHandler()
  const [ragEnabled, setRagEnabled] = useState(false)
  const ragEnabledRef = useRef(ragEnabled)
  ragEnabledRef.current = ragEnabled

  const { open, isMobile: isMobileSidebar } = useSidebar()
  const contentLeft = open && !isMobileSidebar ? 'var(--sidebar-width)' : '0px'

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
    <>
      <header
        className="fixed top-0 right-0 z-9 flex h-14 items-center bg-background px-4 transition-[left] duration-200 ease-linear"
        style={{ left: contentLeft }}
      >
        <div className="flex flex-1 items-center">
          {(!open || isMobileSidebar) && <SidebarTrigger />}
        </div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>New Chat</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex flex-1 items-center justify-end">
          <UserMenu />
        </div>
      </header>
      {messages.length === 0
        ? (
            <div className="flex min-h-svh items-center justify-center pt-14">
              <div className="w-full max-w-190">
                <PromptInputProvider>
                  <ChatInput onSend={handleSend} onStop={stop} status={status} ragEnabled={ragEnabled} onRagToggle={() => setRagEnabled((v) => !v)} />
                  <SuggestedActions onSend={handleSend} />
                </PromptInputProvider>
              </div>
            </div>
          )
        : (
            <>
              <div className="min-h-svh pt-14 pb-36">
                <div className="mx-auto w-full max-w-190">
                  <ChatMessages messages={messages} status={status} />
                </div>
              </div>
              <div
                className="fixed right-0 bottom-0 z-9 flex justify-center bg-background transition-[left] duration-200 ease-linear"
                style={{ left: contentLeft }}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-s-0 -top-12.5 bottom-0 z-[-1] h-25 w-full"
                  style={{ background: 'linear-gradient(180deg, color(from var(--background) srgb r g b / 0), color(from var(--background) srgb r g b / 100) 60%)' }}
                />
                <div className="w-full max-w-190">
                  <ChatInput onSend={handleSend} onStop={stop} status={status} ragEnabled={ragEnabled} onRagToggle={() => setRagEnabled((v) => !v)} />
                </div>
              </div>
            </>
          )}
    </>
  )
}

export function ChatPage({ chatId, initialMessages }: ChatPageProps) {
  return (
    <StreamEventProvider>
      <ChatPageInner chatId={chatId} initialMessages={initialMessages} />
    </StreamEventProvider>
  )
}
