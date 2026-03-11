'use client'

import { createContext, use, useCallback, useEffect, useLayoutEffect, useRef } from 'react'

import type { AppStreamEventMap } from '@/lib/ai/stream-events'
import type { ReactNode } from 'react'

type EventType = keyof AppStreamEventMap
type Handler<T extends EventType> = (data: AppStreamEventMap[T]) => void
type HandlerMap = Map<EventType, Set<Handler<EventType>>>

type DispatchFn = (part: { type: string, data: unknown }) => void

const DispatchContext = createContext<DispatchFn | null>(null)
const RegisterContext = createContext<{
  register: <T extends EventType>(type: T, handler: Handler<T>) => () => void
} | null>(null)

export function StreamEventProvider({ children }: { children: ReactNode }) {
  const handlersRef = useRef<HandlerMap>(new Map())

  const register = useCallback(<T extends EventType>(type: T, handler: Handler<T>) => {
    const handlers = handlersRef.current
    if (!handlers.has(type)) {
      handlers.set(type, new Set())
    }
    const set = handlers.get(type) as Set<Handler<EventType>>
    set.add(handler as Handler<EventType>)
    return () => {
      set.delete(handler as Handler<EventType>)
    }
  }, [])

  const dispatch = useCallback<DispatchFn>((part) => {
    const key = part.type.replace(/^data-/, '')
    const set = handlersRef.current.get(key)
    if (set) {
      for (const handler of set) {
        handler(part.data)
      }
    }
  }, [])

  return (
    <RegisterContext value={{ register }}>
      <DispatchContext value={dispatch}>
        {children}
      </DispatchContext>
    </RegisterContext>
  )
}

export function useStreamEventDispatch(): DispatchFn {
  const ctx = use(DispatchContext)
  if (!ctx) throw new Error('useStreamEventDispatch must be used inside StreamEventProvider')
  return ctx
}

export function useStreamEventHandler<T extends EventType>(type: T, handler: Handler<T>) {
  const ctx = use(RegisterContext)
  if (!ctx) throw new Error('useStreamEventHandler must be used inside StreamEventProvider')

  const handlerRef = useRef(handler)
  useLayoutEffect(() => {
    handlerRef.current = handler
  })

  const stableHandler = useCallback((data: AppStreamEventMap[T]) => {
    handlerRef.current(data)
  }, [])

  const { register } = ctx
  useEffect(() => {
    return register(type, stableHandler)
  }, [type, stableHandler, register])
}
