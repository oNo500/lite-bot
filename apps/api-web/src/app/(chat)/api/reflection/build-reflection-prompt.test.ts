import { describe, it, expect } from 'vitest'

import { buildReflectionPrompt } from './build-reflection-prompt'

describe('buildReflectionPrompt', () => {
  it('includes user message in prompt', () => {
    const prompt = buildReflectionPrompt({
      userMessage: 'What is 2+2?',
      assistantMessage: '4',
    })
    expect(prompt).toContain('What is 2+2?')
  })

  it('includes assistant message in prompt', () => {
    const prompt = buildReflectionPrompt({
      userMessage: 'What is 2+2?',
      assistantMessage: 'The answer is 4.',
    })
    expect(prompt).toContain('The answer is 4.')
  })

  it('returns a non-empty string', () => {
    const prompt = buildReflectionPrompt({
      userMessage: 'Hello',
      assistantMessage: 'Hi there!',
    })
    expect(typeof prompt).toBe('string')
    expect(prompt.length).toBeGreaterThan(0)
  })
})
