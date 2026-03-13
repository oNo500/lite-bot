import { tool } from 'ai'
import { evaluate } from 'mathjs'
import { z } from 'zod'

export const aiTools = {
  getCurrentTime: tool({
    description: 'Get the current date and time in ISO 8601 format',
    inputSchema: z.object({}),
    execute: () => Promise.resolve({ time: new Date().toISOString() }),
  }),
  evaluateMath: tool({
    description: 'Evaluate a mathematical expression. Supports arithmetic, algebra, trigonometry, etc.',
    inputSchema: z.object({ expression: z.string() }),
    execute: ({ expression }) => {
      const result: unknown = evaluate(expression)
      return Promise.resolve({ expression, result: String(result) })
    },
  }),
}
