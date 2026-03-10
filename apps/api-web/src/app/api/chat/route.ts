import { createDeepSeek } from '@ai-sdk/deepseek'
import { streamText, convertToModelMessages } from 'ai'
import { z } from 'zod'

import { env } from '@/config/env'

import type { UIMessage } from 'ai'

const deepseek = createDeepSeek({ apiKey: env.DEEPSEEK_API_KEY })

const bodySchema = z.object({
  messages: z.array(z.custom<UIMessage>()),
})

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json())
  if (!parsed.success) return new Response('Bad Request', { status: 400 })
  const { messages } = parsed.data

  const result = streamText({
    model: deepseek('deepseek-chat'),
    messages: await convertToModelMessages(messages),
  })

  return result.toUIMessageStreamResponse()
}
