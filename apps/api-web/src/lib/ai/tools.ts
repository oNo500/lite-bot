import { tool } from 'ai'
import { evaluate } from 'mathjs'
import { z } from 'zod'

import type { ToolSet } from 'ai'

export const getCurrentTimeTool = tool({
  description: 'Get the current date and time in ISO 8601 format',
  inputSchema: z.object({}),
  execute: () => Promise.resolve({ time: new Date().toISOString() }),
})

export const evaluateMathTool = tool({
  description: 'Evaluate a mathematical expression. Supports arithmetic, algebra, trigonometry, etc.',
  inputSchema: z.object({ expression: z.string() }),
  execute: ({ expression }) => {
    const result: unknown = evaluate(expression)
    return Promise.resolve({ expression, result: String(result) })
  },
})

export const aiTools: ToolSet = {
  getCurrentTime: getCurrentTimeTool,
  evaluateMath: evaluateMathTool,
}
