import { describe, expect, it, vi } from 'vitest'

import { runCapabilities } from './run-capabilities'

import type { ChatCapability, ChatContext } from '../types'

const baseCtx: ChatContext = {
  query: 'hi',
  messages: [],
  systemPrompts: [],
  tools: {},
  metadata: {},
}

describe('runCapabilities', () => {
  it('skips disabled capabilities', async () => {
    const preStream = vi.fn((ctx: ChatContext) => Promise.resolve(ctx))
    const cap: ChatCapability = { id: 'x', preStream }

    await runCapabilities([{ capability: cap, config: {}, enabled: false }], baseCtx)

    expect(preStream).not.toHaveBeenCalled()
  })

  it('runs preStream in order and accumulates context', async () => {
    const cap1: ChatCapability = {
      id: 'a',
      preStream: (ctx) => Promise.resolve({ ...ctx, systemPrompts: [...ctx.systemPrompts, 'A'] }),
    }
    const cap2: ChatCapability = {
      id: 'b',
      preStream: (ctx) => Promise.resolve({ ...ctx, systemPrompts: [...ctx.systemPrompts, 'B'] }),
    }

    const result = await runCapabilities(
      [
        { capability: cap1, config: {}, enabled: true },
        { capability: cap2, config: {}, enabled: true },
      ],
      baseCtx,
    )

    expect(result.systemPrompts).toEqual(['A', 'B'])
  })

  it('appends buildSystemPrompt result to systemPrompts', async () => {
    const cap: ChatCapability = {
      id: 's',
      buildSystemPrompt: () => Promise.resolve('system text'),
    }

    const result = await runCapabilities(
      [{ capability: cap, config: {}, enabled: true }],
      baseCtx,
    )

    expect(result.systemPrompts).toEqual(['system text'])
  })

  it('skips null buildSystemPrompt', async () => {
    const cap: ChatCapability = {
      id: 's',
      buildSystemPrompt: () => Promise.resolve(null),
    }

    const result = await runCapabilities(
      [{ capability: cap, config: {}, enabled: true }],
      baseCtx,
    )

    expect(result.systemPrompts).toEqual([])
  })

  it('merges tools from buildTools', async () => {
    const cap: ChatCapability = {
      id: 't',
      buildTools: () => ({ foo: { description: 'f' } } as never),
    }

    const result = await runCapabilities(
      [{ capability: cap, config: {}, enabled: true }],
      baseCtx,
    )

    expect(result.tools).toHaveProperty('foo')
  })
})
