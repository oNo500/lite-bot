'use client'

import { CopyIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'

import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message'

import type { UIMessage } from 'ai'

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
              {message.parts.map((part, i) => {
                if (part.type === 'text') {
                  return (
                    // eslint-disable-next-line @eslint-react/no-array-index-key
                    <MessageResponse key={`${message.id}-${i}`} parseIncompleteMarkdown>
                      {part.text}
                    </MessageResponse>
                  )
                }
                return null
              })}
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
