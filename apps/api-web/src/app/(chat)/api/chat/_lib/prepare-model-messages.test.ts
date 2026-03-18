import { describe, expect, it } from 'vitest'

import { prepareModelMessages } from './prepare-model-messages'

import type { ModelMessage, UIMessage } from 'ai'

function makeUserMessage(id: string, text: string): UIMessage {
  return { id, role: 'user', parts: [{ type: 'text', text }] }
}

function makeAssistantMessage(id: string, text: string): UIMessage {
  return { id, role: 'assistant', parts: [{ type: 'text', text }] }
}

describe('prepareModelMessages', () => {
  it('converts a simple conversation to model messages', async () => {
    const messages: UIMessage[] = [
      makeUserMessage('u1', 'hello'),
      makeAssistantMessage('a1', 'hi'),
    ]
    const result = await prepareModelMessages(messages)
    expect(result).toHaveLength(2)
    expect(result[0]?.role).toBe('user')
    expect(result[1]?.role).toBe('assistant')
  })

  it('returns non-empty array for single user message', async () => {
    const messages: UIMessage[] = [makeUserMessage('u1', 'hello')]
    const result = await prepareModelMessages(messages)
    expect(result.length).toBeGreaterThan(0)
  })

  it('prunes reasoning from non-last assistant messages', async () => {
    const messages: UIMessage[] = [
      makeUserMessage('u1', 'q1'),
      {
        id: 'a1',
        role: 'assistant',
        parts: [
          { type: 'reasoning', reasoning: 'my thinking', providerMetadata: {} },
          { type: 'text', text: 'answer1' },
        ],
      } as unknown as UIMessage,
      makeUserMessage('u2', 'q2'),
      makeAssistantMessage('a2', 'answer2'),
    ]
    const result = await prepareModelMessages(messages)
    // first assistant message should have reasoning stripped
    const firstAssistant = result.find(
      (m: ModelMessage, i: number) => m.role === 'assistant' && i < result.length - 1,
    )
    const reasoningParts
      = firstAssistant && typeof firstAssistant.content !== 'string'
        ? firstAssistant.content.filter((p: { type: string }) => p.type === 'reasoning')
        : []
    expect(reasoningParts).toHaveLength(0)
  })
})
