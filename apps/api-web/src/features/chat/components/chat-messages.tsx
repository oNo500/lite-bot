'use client'

import { CopyIcon, ScanSearch } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message'
import { appPaths } from '@/config/app-paths'
import { MessageEvalButtons } from '@/features/chat/components/message-eval-buttons'
import { ReflectionPanel } from '@/features/chat/components/reflection-panel'

import type { ReflectionResult } from '@/features/chat/components/reflection-panel'
import type { DynamicToolUIPart, UIMessage } from 'ai'

import 'streamdown/styles.css'

type ReflectionState
  = | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'done', result: ReflectionResult }
    | { status: 'error', message: string }

function AssistantActions({ message, messages }: { message: UIMessage, messages: UIMessage[] }) {
  const [reflectionState, setReflectionState] = useState<ReflectionState>({ status: 'idle' })

  async function handleReflect() {
    if (reflectionState.status === 'loading') return

    const assistantText = message.parts
      .filter((p) => p.type === 'text')
      .map((p) => (p as { type: 'text', text: string }).text)
      .join('')

    // Find the user message just before this assistant message
    const msgIndex = messages.findIndex((m) => m.id === message.id)
    const userMsg = messages.slice(0, msgIndex).findLast((m) => m.role === 'user')
    const userText = userMsg?.parts
      .filter((p) => p.type === 'text')
      .map((p) => (p as { type: 'text', text: string }).text)
      .join('') ?? ''

    setReflectionState({ status: 'loading' })
    try {
      const res = await fetch(appPaths.api.reflection.href, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: message.id,
          userMessage: userText,
          assistantMessage: assistantText,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const result = await res.json() as ReflectionResult
      setReflectionState({ status: 'done', result })
    } catch (error) {
      setReflectionState({ status: 'error', message: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  return (
    <>
      <MessageActions className="mt-1 ml-1">
        <MessageAction
          onClick={() => {
            const text = message.parts
              .filter((p) => p.type === 'text')
              .map((p) => (p as { type: 'text', text: string }).text)
              .join('')
            void navigator.clipboard.writeText(text)
          }}
          tooltip="Copy"
          label="Copy message"
        >
          <CopyIcon className="size-3" />
        </MessageAction>
        <MessageEvalButtons messageId={message.id} />
        <MessageAction
          onClick={() => void handleReflect()}
          tooltip="自检"
          label="Reflect on this response"
          disabled={reflectionState.status === 'loading'}
        >
          <ScanSearch className="size-3" />
        </MessageAction>
      </MessageActions>
      <ReflectionPanel state={reflectionState} />
    </>
  )
}

function renderMessageParts(message: UIMessage) {
  const counters: Record<string, number> = {}
  return message.parts.map((part) => {
    counters[part.type] = (counters[part.type] ?? 0) + 1
    const key = `${message.id}-${part.type}-${counters[part.type]}`
    if (part.type === 'text') {
      return (
        <MessageResponse key={key} parseIncompleteMarkdown>
          {part.text}
        </MessageResponse>
      )
    }
    if (part.type === 'file' && 'url' in part && 'mediaType' in part) {
      const alt = 'filename' in part ? String(part.filename) : 'Attached image'
      return <Image key={key} src={part.url} alt={alt} width={320} height={320} className="rounded-lg object-contain" />
    }
    if (part.type === 'dynamic-tool' || part.type.startsWith('tool-')) {
      const toolPart = part as DynamicToolUIPart
      const toolName = part.type === 'dynamic-tool'
        ? toolPart.toolName
        : part.type.slice('tool-'.length)
      const isDone = toolPart.state === 'output-available'
      return (
        <div key={key} className="text-xs border border-border/60 rounded-md overflow-hidden my-1">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 border-b border-border/40">
            <span className="font-mono text-muted-foreground">fn</span>
            <span className="font-semibold text-foreground">{toolName}</span>
            {!isDone && (
              <span className="ml-auto flex items-center gap-1 text-muted-foreground">
                <span className="inline-block size-1.5 rounded-full bg-amber-400 animate-pulse" />
                running
              </span>
            )}
            {isDone && (
              <span className="ml-auto text-emerald-500">done</span>
            )}
          </div>
          {isDone && (
            <div className="px-3 py-2 space-y-1.5 font-mono">
              {toolPart.input != null && Object.keys(toolPart.input as Record<string, unknown>).length > 0 && (
                <div className="text-muted-foreground/70">
                  <span className="text-muted-foreground">in </span>
                  {JSON.stringify(toolPart.input)}
                </div>
              )}
              <div>
                <span className="text-muted-foreground">out </span>
                <span className="text-foreground">{JSON.stringify(toolPart.output)}</span>
              </div>
            </div>
          )}
        </div>
      )
    }
    return null
  })
}

export function ChatMessages({ messages }: { messages: UIMessage[] }) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) return null

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <div key={message.id}>
          <Message from={message.role}>
            <MessageContent>
              {renderMessageParts(message)}
            </MessageContent>
          </Message>
          {message.role === 'assistant' && (
            <AssistantActions message={message} messages={messages} />
          )}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
