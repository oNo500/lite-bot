import { generateObject } from 'ai'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { treeifyError, z } from 'zod'

import { model } from '@/lib/ai/provider'
import { auth } from '@/lib/auth'

import { buildReflectionPrompt } from './build-reflection-prompt'

const requestSchema = z.object({
  messageId: z.string(),
  userMessage: z.string().min(1),
  assistantMessage: z.string().min(1),
})

const reflectionSchema = z.object({
  issues: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  suggestion: z.string().optional(),
})

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: unknown = await req.json().catch(() => null)
  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Bad Request', details: treeifyError(parsed.error) }, { status: 400 })
  }

  const { userMessage, assistantMessage } = parsed.data
  const prompt = buildReflectionPrompt({ userMessage, assistantMessage })

  const { object } = await generateObject({
    model,
    schema: reflectionSchema,
    prompt,
  })

  return NextResponse.json(object)
}
