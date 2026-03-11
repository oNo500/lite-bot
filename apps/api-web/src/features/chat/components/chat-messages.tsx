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

import type { UIMessage } from 'ai'

import 'streamdown/styles.css'

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
              {(() => {
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
                  return null
                })
              })()}
            </MessageContent>
          </Message>
          {message.role === 'assistant' && (
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
            </MessageActions>
          )}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
