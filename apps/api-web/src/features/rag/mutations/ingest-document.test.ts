import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/db', () => ({
  db: {
    update: vi.fn(),
    insert: vi.fn(),
  },
}))
vi.mock('@/lib/rag/chunk', () => ({
  chunkText: vi.fn(),
}))
vi.mock('@/lib/rag/embed', () => ({
  embedTexts: vi.fn(),
}))

import { db } from '@/db'
import { chunkText } from '@/lib/rag/chunk'
import { embedTexts } from '@/lib/rag/embed'

import { ingestDocument } from './ingest-document'

const mockDb = vi.mocked(db)

function setupUpdate(): { set: ReturnType<typeof vi.fn>, where: ReturnType<typeof vi.fn> } {
  const where = vi.fn().mockResolvedValue(undefined as never)
  const set = vi.fn().mockReturnValue({ where })
  mockDb.update.mockReturnValue({ set } as never)
  return { set, where }
}

function setupInsert(): ReturnType<typeof vi.fn> {
  const values = vi.fn().mockResolvedValue(undefined as never)
  mockDb.insert.mockReturnValue({ values } as never)
  return values
}

describe('ingestDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates status to processing then ready on success', async () => {
    vi.mocked(chunkText).mockReturnValue([
      { content: 'a', charStart: 0, charEnd: 1, tokenCount: 1 },
    ])
    vi.mocked(embedTexts).mockResolvedValue([[0.1, 0.2]])

    setupUpdate()
    setupInsert()

    await ingestDocument({ documentId: 'doc-1', content: 'hello', mimeType: 'text/plain' })

    expect(mockDb.update).toHaveBeenCalledTimes(2)
  })

  it('writes error status when chunking throws', async () => {
    vi.mocked(chunkText).mockImplementation(() => {
      throw new Error('boom')
    })

    const updateSpy = setupUpdate()

    await ingestDocument({ documentId: 'doc-1', content: 'x', mimeType: 'text/plain' })

    expect(mockDb.update).toHaveBeenCalledTimes(2)
    expect(updateSpy.set).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'error', errorMessage: 'boom' }),
    )
  })

  it('persists rawContent and chunkConfig on the document', async () => {
    vi.mocked(chunkText).mockReturnValue([
      { content: 'x', charStart: 0, charEnd: 1, tokenCount: 1 },
    ])
    vi.mocked(embedTexts).mockResolvedValue([[0.1]])

    const updateSpy = setupUpdate()
    setupInsert()

    await ingestDocument({ documentId: 'doc-9', content: 'big content', mimeType: 'text/plain' })

    expect(updateSpy.set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'processing',
        rawContent: 'big content',
        chunkConfig: expect.objectContaining({ strategy: 'fixed' }) as unknown,
      }),
    )
  })

  it('handles JSON mimetype by treating each record as a chunk', async () => {
    const insertValues = setupInsert()
    setupUpdate()

    const records = [{ a: 1 }, { b: 'two' }]
    await ingestDocument({
      documentId: 'doc-2',
      content: JSON.stringify(records),
      mimeType: 'application/json',
    })

    expect(chunkText).not.toHaveBeenCalled()
    const insertedRows = insertValues.mock.calls[0]![0] as { content: string }[]
    expect(insertedRows).toHaveLength(2)
    expect(insertedRows[0]!.content).toBe(JSON.stringify(records[0]))
    expect(insertedRows[1]!.content).toBe(JSON.stringify(records[1]))
  })

  it('inserts chunks with embedding aligned by index', async () => {
    vi.mocked(chunkText).mockReturnValue([
      { content: 'a', charStart: 0, charEnd: 1, tokenCount: 1 },
      { content: 'b', charStart: 1, charEnd: 2, tokenCount: 1 },
    ])
    vi.mocked(embedTexts).mockResolvedValue([[0.1], [0.2]])

    const insertValues = setupInsert()
    setupUpdate()

    await ingestDocument({ documentId: 'doc-5', content: 'a b', mimeType: 'text/plain' })

    const rows = insertValues.mock.calls[0]![0] as {
      content: string
      embedding: number[]
      chunkIndex: number
      charStart: number
      charEnd: number
      tokenCount: number
      documentId: string
    }[]
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      content: 'a',
      embedding: [0.1],
      chunkIndex: 0,
      charStart: 0,
      charEnd: 1,
      documentId: 'doc-5',
    })
    expect(rows[1]).toMatchObject({
      content: 'b',
      embedding: [0.2],
      chunkIndex: 1,
    })
  })

  it('skips embedding + insert when chunks are empty', async () => {
    vi.mocked(chunkText).mockReturnValue([])

    const insertValues = setupInsert()
    setupUpdate()

    await ingestDocument({ documentId: 'doc-empty', content: '   ', mimeType: 'text/plain' })

    expect(embedTexts).not.toHaveBeenCalled()
    expect(insertValues).not.toHaveBeenCalled()
  })
})
