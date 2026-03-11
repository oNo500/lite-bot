'use client'

import { PaperclipIcon, XIcon } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

import {
  PromptInput,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  usePromptInputAttachments,
} from '@/components/ai-elements/prompt-input'
import { appPaths } from '@/config/app-paths'

import type { PromptInputMessage } from '@/components/ai-elements/prompt-input'
import type { ChatStatus, FileUIPart, TextUIPart } from 'ai'

type MessagePart = TextUIPart | FileUIPart

interface ChatInputProps {
  onSend: (parts: MessagePart[]) => void
  onStop?: () => void
  status?: ChatStatus
}

async function uploadFile(dataUrl: string, mediaType: string): Promise<string> {
  const res = await fetch(dataUrl)
  const blob = await res.blob()
  const ext = mediaType === 'image/png' ? 'png' : 'jpg'
  const formData = new FormData()
  formData.append('file', blob, `upload.${ext}`)
  const response = await fetch(appPaths.api.files.upload.href, { method: 'POST', body: formData })
  if (!response.ok) throw new Error('Upload failed')
  const { url } = await response.json() as { url: string }
  return url
}

function AttachButton() {
  const { openFileDialog } = usePromptInputAttachments()
  return (
    <PromptInputButton tooltip="Attach image" onClick={openFileDialog} aria-label="Attach image">
      <PaperclipIcon className="size-4" />
    </PromptInputButton>
  )
}

function FilePreview() {
  const { files, remove } = usePromptInputAttachments()
  if (files.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2 px-3 pt-3">
      {files.map((file) => (
        <div key={file.id} className="relative size-16 rounded-md overflow-hidden border bg-muted">
          <Image src={file.url} alt={file.filename ?? 'attachment'} width={64} height={64} className="size-full object-cover" unoptimized />
          <button
            type="button"
            onClick={() => remove(file.id)}
            className="absolute top-0.5 right-0.5 rounded-full bg-background/80 p-0.5 hover:bg-background"
            aria-label="Remove attachment"
          >
            <XIcon className="size-3" />
          </button>
        </div>
      ))}
    </div>
  )
}

export function ChatInput({ onSend, onStop, status }: ChatInputProps) {
  const [isUploading, setIsUploading] = useState(false)

  async function handleSubmit(message: PromptInputMessage) {
    const text = message.text?.trim() ?? ''
    if (!text && message.files.length === 0) return

    setIsUploading(true)
    try {
      const fileParts: FileUIPart[] = await Promise.all(
        message.files.map(async (file) => {
          const remoteUrl = await uploadFile(file.url, file.mediaType)
          return { type: 'file' as const, url: remoteUrl, mediaType: file.mediaType, filename: file.filename }
        }),
      )
      const textParts: TextUIPart[] = text ? [{ type: 'text' as const, text }] : []
      onSend([...fileParts, ...textParts])
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <PromptInput
      onSubmit={handleSubmit}
      className="border-t rounded-none"
      accept="image/jpeg,image/png"
    >
      <FilePreview />
      <PromptInputBody>
        <PromptInputTextarea placeholder="Send a message..." />
      </PromptInputBody>
      <PromptInputFooter className="justify-between">
        <AttachButton />
        <PromptInputSubmit status={isUploading ? 'submitted' : status} onStop={onStop} />
      </PromptInputFooter>
    </PromptInput>
  )
}
