import { devToolsMiddleware } from '@ai-sdk/devtools'
import { createXai } from '@ai-sdk/xai'
import { wrapLanguageModel } from 'ai'

import { env } from '@/config/env'

const xai = createXai({ apiKey: env.XAI_API_KEY })
const baseModel = xai('grok-4-fast-reasoning')

export const model
  = env.NODE_ENV === 'development'
    ? wrapLanguageModel({ model: baseModel, middleware: devToolsMiddleware() })
    : baseModel
