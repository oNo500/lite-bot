import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/db', () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
  },
}))

import { db } from '@/db'

import { upsertThumbsEval, getEvalByMessageId } from './eval-queries'

const mockDb = vi.mocked(db)

describe('upsertThumbsEval', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('inserts with onConflictDoUpdate (upsert is idempotent)', async () => {
    const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined as void)
    const values = vi.fn().mockReturnValue({ onConflictDoUpdate })
    const into = vi.fn().mockReturnValue({ values })
    mockDb.insert.mockReturnValue({ into, values } as never)

    // Simulate calling twice with same messageId
    await upsertThumbsEval('msg-1', 1)
    await upsertThumbsEval('msg-1', -1)

    expect(mockDb.insert).toHaveBeenCalledTimes(2)
    // Both calls use onConflictDoUpdate to upsert
    expect(onConflictDoUpdate).toHaveBeenCalledTimes(2)
  })

  it('passes correct score to insert', async () => {
    const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined as void)
    const values = vi.fn().mockReturnValue({ onConflictDoUpdate })
    mockDb.insert.mockReturnValue({ values } as never)

    await upsertThumbsEval('msg-2', -1)

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({ messageId: 'msg-2', score: -1 }),
    )
  })
})

describe('getEvalByMessageId', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns eval record when found', async () => {
    const record = { id: 'eval-1', messageId: 'msg-1', score: 1, createdAt: new Date(), updatedAt: new Date() }
    const where = vi.fn().mockResolvedValue([record])
    const from = vi.fn().mockReturnValue({ where })
    mockDb.select.mockReturnValue({ from } as never)

    const result = await getEvalByMessageId('msg-1')
    expect(result).toEqual(record)
  })

  it('returns undefined when not found', async () => {
    const where = vi.fn().mockResolvedValue([])
    const from = vi.fn().mockReturnValue({ where })
    mockDb.select.mockReturnValue({ from } as never)

    const result = await getEvalByMessageId('msg-999')
    expect(result).toBeUndefined()
  })
})
