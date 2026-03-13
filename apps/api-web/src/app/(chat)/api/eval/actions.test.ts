import { describe, it, expect, vi, beforeEach } from 'vitest'

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

vi.mock('@/db/eval-queries', () => ({
  upsertThumbsEval: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
  },
}))

vi.mock('@/db/schema', () => ({
  chatMessage: { id: 'id', chatId: 'chatId' },
  chat: { id: 'id', userId: 'userId' },
}))

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  and: vi.fn(),
}))

import { db } from '@/db'
import { upsertThumbsEval } from '@/db/eval-queries'
import { auth } from '@/lib/auth'

import { submitThumbsEval } from './actions'

const mockAuth = vi.mocked(auth.api.getSession)
const mockUpsert = vi.mocked(upsertThumbsEval)
const mockDb = vi.mocked(db)

function makeSelectChain(result: unknown[]) {
  const where = vi.fn().mockResolvedValue(result)
  const innerJoin = vi.fn().mockReturnValue({ where })
  const from = vi.fn().mockReturnValue({ innerJoin })
  return { from, innerJoin, where }
}

describe('submitThumbsEval', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const result = await submitThumbsEval('msg-1', 1)
    expect(result).toEqual({ error: 'Unauthorized' })
    expect(mockUpsert).not.toHaveBeenCalled()
  })

  it('returns error when message does not belong to current user', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    const { from } = makeSelectChain([])
    mockDb.select.mockReturnValue({ from } as never)

    const result = await submitThumbsEval('msg-other', 1)
    expect(result).toEqual({ error: 'Forbidden' })
    expect(mockUpsert).not.toHaveBeenCalled()
  })

  it('calls upsertThumbsEval when message belongs to user', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockUpsert.mockResolvedValue()
    const { from } = makeSelectChain([{ id: 'msg-1' }])
    mockDb.select.mockReturnValue({ from } as never)

    await submitThumbsEval('msg-1', 1)
    expect(mockUpsert).toHaveBeenCalledWith('msg-1', 1)
  })
})
