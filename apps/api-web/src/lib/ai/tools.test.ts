import { describe, expect, it } from 'vitest'

import { aiTools, evaluateMathTool, getCurrentTimeTool } from './tools'

const execCtx = { toolCallId: 'test', messages: [], abortSignal: new AbortController().signal }

describe('getCurrentTimeTool', () => {
  it('returns a time string in ISO 8601 format', async () => {
    expect(getCurrentTimeTool.execute).toBeDefined()
    const raw = await getCurrentTimeTool.execute!({}, execCtx)
    const result = raw as { time: string }
    expect(result.time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })
})

describe('evaluateMathTool', () => {
  it('evaluates a simple arithmetic expression', async () => {
    expect(evaluateMathTool.execute).toBeDefined()
    const raw = await evaluateMathTool.execute!({ expression: '2 + 3' }, execCtx)
    const result = raw as { expression: string, result: string }
    expect(result.result).toBe('5')
    expect(result.expression).toBe('2 + 3')
  })

  it('evaluates a more complex expression', async () => {
    const raw = await evaluateMathTool.execute!({ expression: 'sqrt(16)' }, execCtx)
    const result = raw as { expression: string, result: string }
    expect(result.result).toBe('4')
  })
})

describe('aiTools', () => {
  it('includes getCurrentTime and evaluateMath', () => {
    expect(aiTools).toHaveProperty('getCurrentTime')
    expect(aiTools).toHaveProperty('evaluateMath')
  })

  it('getCurrentTime is the same as getCurrentTimeTool', () => {
    expect(aiTools.getCurrentTime).toBe(getCurrentTimeTool)
  })

  it('evaluateMath is the same as evaluateMathTool', () => {
    expect(aiTools.evaluateMath).toBe(evaluateMathTool)
  })
})
