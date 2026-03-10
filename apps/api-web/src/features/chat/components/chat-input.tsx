'use client'

import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,

} from '@/components/ai-elements/prompt-input'

import type { PromptInputMessage } from '@/components/ai-elements/prompt-input'
import type { ChatStatus } from 'ai'

interface ChatInputProps {
  onSend: (text: string) => void
  onStop?: () => void
  status?: ChatStatus
}

export function ChatInput({ onSend, onStop, status }: ChatInputProps) {
  function handleSubmit(message: PromptInputMessage) {
    const text = message.text?.trim() ?? ''
    if (!text) return
    onSend(text)
  }

  return (
    <PromptInput onSubmit={handleSubmit} className="border-t rounded-none">
      <PromptInputBody>
        <PromptInputTextarea placeholder="Send a message..." />
      </PromptInputBody>
      <PromptInputFooter className="justify-end">
        <PromptInputSubmit status={status} onStop={onStop} />
      </PromptInputFooter>
    </PromptInput>
  )
}
