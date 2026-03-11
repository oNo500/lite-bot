import { z } from 'zod'

import type { UIMessage, UIMessageStreamWriter } from 'ai'

export type AppStreamEventMap = {
  'chat-title': string
} & Record<string, unknown>

export type AppUIMessage = UIMessage<undefined, AppStreamEventMap>

export const appDataPartSchemas = {
  'chat-title': z.string(),
} satisfies { [K in keyof AppStreamEventMap]: z.ZodType<AppStreamEventMap[K]> }

export function createEventWriter(writer: UIMessageStreamWriter) {
  return {
    writeChatTitle(title: string) {
      writer.write({ type: 'data-chat-title', data: title, transient: true })
    },
  }
}
