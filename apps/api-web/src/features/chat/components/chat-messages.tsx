'use client'

import { CopyIcon } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef } from 'react'

import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message'
import { MessageEvalButtons } from '@/features/chat/components/message-eval-buttons'

import type { DynamicToolUIPart, UIMessage } from 'ai'

import 'streamdown/styles.css'

function AssistantActions({ message }: { message: UIMessage, messages: UIMessage[] }) {
  return (
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
    </MessageActions>
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
        <div key={key} className="my-1 overflow-hidden rounded-md border border-border/60 text-xs">
          <div className="flex items-center gap-2 border-b border-border/40 bg-muted/40 px-3 py-1.5">
            <span className="font-mono text-muted-foreground">fn</span>
            <span className="font-semibold text-foreground">{toolName}</span>
            {!isDone && (
              <span className="ml-auto flex items-center gap-1 text-muted-foreground">
                <span className="inline-block size-1.5 animate-pulse rounded-full bg-amber-400" />
                running
              </span>
            )}
            {isDone && (
              <span className="ml-auto text-emerald-500">done</span>
            )}
          </div>
          {isDone && (
            <div className="space-y-1.5 px-3 py-2 font-mono">
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

function hasContent(message: UIMessage) {
  return message.parts.some(
    (p) => (p.type === 'text' && p.text.length > 0) || p.type === 'file' || p.type === 'dynamic-tool' || p.type.startsWith('tool-'),
  )
}

export function ChatMessages({ messages, status }: { messages: UIMessage[], status?: string }) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) return null

  const isStreaming = status === 'submitted' || status === 'streaming'
  const lastMessage = messages.at(-1)
  const showLoading = isStreaming && lastMessage?.role === 'assistant' && !hasContent(lastMessage)

  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4">
      {messages.map((message) => (
        <div key={message.id}>
          <Message from={message.role}>
            <MessageContent>
              {renderMessageParts(message)}
            </MessageContent>
          </Message>
          {message.role === 'assistant' && hasContent(message) && !(isStreaming && message.id === lastMessage?.id) && (
            <AssistantActions message={message} messages={messages} />
          )}
        </div>
      ))}
      {showLoading && (
        <div className="flex gap-1 px-4">
          <span className="inline-block size-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.3s]" />
          <span className="inline-block size-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.15s]" />
          <span className="inline-block size-1.5 animate-bounce rounded-full bg-muted-foreground/50" />
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
