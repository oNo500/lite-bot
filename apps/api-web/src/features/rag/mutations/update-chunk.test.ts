import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
}))
vi.mock('@/lib/rag/embed', () => ({
  embedTexts: vi.fn(),
}))

import { db } from '@/db'
import { embedTexts } from '@/lib/rag/embed'

import { updateChunk } from './update-chunk'

const mockDb = vi.mocked(db)

interface ExistingRow {
  id: string
  documentId: string
  content: string
  editedContent: string | null
  chunkIndex: number
  charStart: number
  charEnd: number
  tokenCount: number
  enabled: boolean
  ownerId: string
}

function setupSelect(rows: ExistingRow[]): void {
  const limit = vi.fn().mockResolvedValue(rows)
  const where = vi.fn().mockReturnValue({ limit })
  const innerJoin = vi.fn().mockReturnValue({ where })
  const from = vi.fn().mockReturnValue({ innerJoin })
  mockDb.select.mockReturnValue({ from } as never)
}

function setupUpdate(): { set: ReturnType<typeof vi.fn>, where: ReturnType<typeof vi.fn> } {
  const where = vi.fn().mockResolvedValue(undefined as never)
  const set = vi.fn().mockReturnValue({ where })
  mockDb.update.mockReturnValue({ set } as never)
  return { set, where }
}

const baseRow: ExistingRow = {
  id: 'chunk-1',
  documentId: 'doc-1',
  content: 'original',
  editedContent: null,
  chunkIndex: 0,
  charStart: 0,
  charEnd: 8,
  tokenCount: 2,
  enabled: true,
  ownerId: 'user-1',
}

describe('updateChunk', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when chunk not found / cross-user', async () => {
    setupSelect([])
    const result = await updateChunk({ chunkId: 'x', userId: 'user-1', patch: { enabled: false } })
    expect(result).toBeNull()
  })

  it('toggling enabled does not call embedTexts', async () => {
    setupSelect([baseRow])
    const { set } = setupUpdate()

    const result = await updateChunk({
      chunkId: 'chunk-1',
      userId: 'user-1',
      patch: { enabled: false },
    })

    expect(embedTexts).not.toHaveBeenCalled()
    expect(set).toHaveBeenCalledWith({ enabled: false })
    expect(result?.enabled).toBe(false)
  })

  it('setting editedContent triggers re-embed', async () => {
    setupSelect([baseRow])
    const { set } = setupUpdate()
    vi.mocked(embedTexts).mockResolvedValue([[0.1, 0.2]])

    const result = await updateChunk({
      chunkId: 'chunk-1',
      userId: 'user-1',
      patch: { editedContent: 'new content' },
    })

    expect(embedTexts).toHaveBeenCalledWith(['new content'])
    expect(set).toHaveBeenCalledWith({
      editedContent: 'new content',
      embedding: [0.1, 0.2],
    })
    expect(result?.editedContent).toBe('new content')
  })

  it('clearing editedContent (null) re-embeds with original content', async () => {
    setupSelect([{ ...baseRow, editedContent: 'edited' }])
    const { set } = setupUpdate()
    vi.mocked(embedTexts).mockResolvedValue([[0.3]])

    const result = await updateChunk({
      chunkId: 'chunk-1',
      userId: 'user-1',
      patch: { editedContent: null },
    })

    expect(embedTexts).toHaveBeenCalledWith(['original'])
    expect(set).toHaveBeenCalledWith({ editedContent: null, embedding: [0.3] })
    expect(result?.editedContent).toBeNull()
  })

  it('does not re-embed when editedContent identical to existing', async () => {
    setupSelect([{ ...baseRow, editedContent: 'same' }])
    setupUpdate()

    await updateChunk({
      chunkId: 'chunk-1',
      userId: 'user-1',
      patch: { editedContent: 'same' },
    })

    expect(embedTexts).not.toHaveBeenCalled()
  })

  it('updates both enabled and editedContent in one call', async () => {
    setupSelect([baseRow])
    const { set } = setupUpdate()
    vi.mocked(embedTexts).mockResolvedValue([[0.5]])

    await updateChunk({
      chunkId: 'chunk-1',
      userId: 'user-1',
      patch: { enabled: false, editedContent: 'new' },
    })

    expect(set).toHaveBeenCalledWith({
      enabled: false,
      editedContent: 'new',
      embedding: [0.5],
    })
  })
})
