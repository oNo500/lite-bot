import { describe, it, expect, vi, beforeEach } from 'vitest'

import { auth } from '@/lib/auth'

import { POST } from './route'

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}))

vi.mock('ai', () => ({
  generateText: vi.fn(),
  Output: { object: vi.fn().mockReturnValue('mock-output-config') },
}))

vi.mock('@/lib/ai/provider', () => ({
  model: 'mock-model',
}))

vi.mock('./build-reflection-prompt', () => ({
  buildReflectionPrompt: vi.fn().mockReturnValue('mock prompt'),
}))

const mockAuth = vi.mocked(auth.api.getSession)

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/reflection', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('pOST /api/reflection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const req = makeRequest({ messageId: 'msg-1', userMessage: 'hi', assistantMessage: 'hello' })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 when required fields are missing', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    const req = makeRequest({ messageId: 'msg-1' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns structured reflection object on success', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    const { generateText } = await import('ai')
    vi.mocked(generateText).mockResolvedValue({
      output: { issues: [], confidence: 0.9, suggestion: undefined },
    } as never)

    const req = makeRequest({
      messageId: 'msg-1',
      userMessage: 'What is 2+2?',
      assistantMessage: '4',
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json() as { confidence: number }
    expect(body.confidence).toBe(0.9)
  })
})
