import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { withErrorHandler } from './with-error-handler'

describe('withErrorHandler', () => {
  it('passes through 2xx responses', async () => {
    const handler = withErrorHandler(async () => Response.json({ ok: true }))
    const res = await handler(new Request('http://test'), { params: Promise.resolve({}) })

    expect(res.status).toBe(200)
  })

  it('maps ZodError to 400', async () => {
    const schema = z.object({ name: z.string() })
    const handler = withErrorHandler(async () => {
      schema.parse({ name: 123 })
      return Response.json({ ok: true })
    })
    const res = await handler(new Request('http://test'), { params: Promise.resolve({}) })
    const body = await res.json() as { error: string, issues: unknown[] }

    expect(res.status).toBe(400)
    expect(body.error).toBe('ValidationError')
    expect(body.issues).toBeInstanceOf(Array)
  })

  it('maps unknown error to 500', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const handler = withErrorHandler(async () => {
      throw new Error('boom')
    })
    const res = await handler(new Request('http://test'), { params: Promise.resolve({}) })

    expect(res.status).toBe(500)
    errorSpy.mockRestore()
  })
})
