import { z } from 'zod'

export const filePartSchema = z.object({
  type: z.literal('file'),
  url: z.url().refine((u) => u.startsWith('https://'), 'Only https URLs allowed'),
  mediaType: z.enum(['image/jpeg', 'image/png']),
  filename: z.string().optional(),
})

export const messagePartSchema = z.union([
  z.object({ type: z.literal('text'), text: z.string() }),
  filePartSchema,
  z.looseObject({ type: z.string() }),
])

export const uiMessageSchema = z.looseObject({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  parts: z.array(messagePartSchema),
})

export const bodySchema = z.object({
  messages: z.array(uiMessageSchema),
  chatId: z.uuid(),
  useRag: z.boolean().optional().default(false),
})
