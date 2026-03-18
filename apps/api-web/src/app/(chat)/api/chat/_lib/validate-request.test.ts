import { describe, expect, it } from 'vitest'

import { bodySchema, filePartSchema } from './validate-request'

describe('filePartSchema', () => {
  it('accepts a valid https image URL', () => {
    const result = filePartSchema.safeParse({
      type: 'file',
      url: 'https://example.com/image.jpg',
      mediaType: 'image/jpeg',
    })
    expect(result.success).toBe(true)
  })

  it('rejects non-https URLs', () => {
    const result = filePartSchema.safeParse({
      type: 'file',
      url: 'http://example.com/image.jpg',
      mediaType: 'image/jpeg',
    })
    expect(result.success).toBe(false)
  })

  it('rejects unsupported media types', () => {
    const result = filePartSchema.safeParse({
      type: 'file',
      url: 'https://example.com/image.gif',
      mediaType: 'image/gif',
    })
    expect(result.success).toBe(false)
  })
})

describe('bodySchema', () => {
  const validBody = {
    chatId: '00000000-0000-0000-0000-000000000000',
    messages: [
      { id: 'msg1', role: 'user', parts: [{ type: 'text', text: 'hello' }] },
    ],
  }

  it('accepts a valid body', () => {
    const result = bodySchema.safeParse(validBody)
    expect(result.success).toBe(true)
  })

  it('defaults useRag to false when not provided', () => {
    const result = bodySchema.safeParse(validBody)
    expect(result.success).toBe(true)
    expect(result.success && result.data.useRag).toBe(false)
  })

  it('rejects an invalid chatId (non-uuid)', () => {
    const result = bodySchema.safeParse({ ...validBody, chatId: 'not-a-uuid' })
    expect(result.success).toBe(false)
  })

  it('rejects missing messages field', () => {
    const result = bodySchema.safeParse({ chatId: '00000000-0000-0000-0000-000000000001' })
    expect(result.success).toBe(false)
  })

  it('rejects messages with invalid role', () => {
    const result = bodySchema.safeParse({
      ...validBody,
      messages: [{ id: 'msg1', role: 'bot', parts: [] }],
    })
    expect(result.success).toBe(false)
  })
})
