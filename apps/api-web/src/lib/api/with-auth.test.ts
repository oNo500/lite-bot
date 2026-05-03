import { describe, expect, it, vi } from 'vitest'

import { withAuth } from './with-auth'

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}))

vi.mock('next/headers', () => ({
  headers: () => new Headers(),
}))

describe('withAuth', () => {
  it('returns 401 when no session', async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth.api.getSession).mockResolvedValue(null)

    const handler = withAuth(async () => Response.json({ ok: true }))
    const res = await handler(new Request('http://test'), { params: Promise.resolve({}) })

    expect(res.status).toBe(401)
  })

  it('passes session to inner handler when authed', async () => {
    const { auth } = await import('@/lib/auth')
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: 'u1' },
      session: { id: 's1' },
    } as never)

    const handler = withAuth(async (_req, ctx) => Response.json({ uid: ctx.auth.session.user.id }))
    const res = await handler(new Request('http://test'), { params: Promise.resolve({}) })

    expect(await res.json()).toEqual({ uid: 'u1' })
  })
})
