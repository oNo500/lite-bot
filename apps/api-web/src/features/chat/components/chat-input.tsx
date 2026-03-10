'use client'

import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { useState } from 'react'

interface ChatInputProps {
  onSend: (text: string) => void
  isLoading?: boolean
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [value, setValue] = useState('')

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const text = value.trim()
    if (!text) return
    if (isLoading) return
    onSend(text)
    setValue('')
  }

  const isDisabled = isLoading === true || !value.trim()

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t">
      <Input
        id="chat-input"
        value={value}
        onChange={(e) => setValue(e.currentTarget.value)}
        placeholder="Send a message..."
        disabled={isLoading}
        className="flex-1"
      />
      <Button type="submit" disabled={isDisabled}>
        Send
      </Button>
    </form>
  )
}
