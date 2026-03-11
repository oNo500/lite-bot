'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { useStreamEventHandler } from '@/components/stream-event-provider'

export function useChatTitleHandler() {
  const queryClient = useQueryClient()
  const handler = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['chat-history'] })
  }, [queryClient])
  useStreamEventHandler('chat-title', handler)
}
