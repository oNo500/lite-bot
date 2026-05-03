import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
  },
}))

import { db } from '@/db'

import { getDocumentChunks } from './get-document-chunks'

const mockDb = vi.mocked(db)

interface DocRow {
  id: string
  name: string
  rawContent: string | null
  chunkConfig: { strategy: string, size: number, overlap: number } | null
}

function setupSelectChain(docRows: DocRow[], chunkRows: unknown[]): void {
  let call = 0
  mockDb.select.mockImplementation(() => {
    call += 1
    if (call === 1) {
      const limit = vi.fn().mockResolvedValue(docRows)
      const where = vi.fn().mockReturnValue({ limit })
      const from = vi.fn().mockReturnValue({ where })
      return { from } as never
    }
    const orderBy = vi.fn().mockResolvedValue(chunkRows)
    const where = vi.fn().mockReturnValue({ orderBy })
    const from = vi.fn().mockReturnValue({ where })
    return { from } as never
  })
}

describe('getDocumentChunks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when document not found / cross-user', async () => {
    setupSelectChain([], [])
    const result = await getDocumentChunks('doc-1', 'user-1')
    expect(result).toBeNull()
  })

  it('returns document and chunk list when owned', async () => {
    const doc = {
      id: 'doc-1',
      name: 'foo.txt',
      rawContent: 'hello world',
      chunkConfig: { strategy: 'fixed' as const, size: 5, overlap: 1 },
    }
    const chunks = [
      {
        id: 'c1',
        chunkIndex: 0,
        content: 'hello',
        editedContent: null,
        charStart: 0,
        charEnd: 5,
        tokenCount: 1,
        enabled: true,
      },
    ]
    setupSelectChain([doc], chunks)

    const result = await getDocumentChunks('doc-1', 'user-1')

    expect(result).toEqual({ document: doc, chunks })
  })
})
