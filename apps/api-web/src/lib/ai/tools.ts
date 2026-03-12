import { tool } from 'ai'
import { z } from 'zod'

export const aiTools = {
  getCurrentTime: tool({
    description: 'Get the current date and time in ISO 8601 format',
    inputSchema: z.object({}),
    execute: async () => ({ time: new Date().toISOString() }),
  }),
}
