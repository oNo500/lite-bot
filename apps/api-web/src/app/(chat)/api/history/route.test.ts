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

vi.mock('@/db/chat-queries', () => ({
  getChatsByUserIdPaginated: vi.fn(),
  deleteChat: vi.fn(),
}))

import { getChatsByUserIdPaginated, deleteChat } from '@/db/chat-queries'
import { auth } from '@/lib/auth'

import { GET, DELETE } from './route'

const mockAuth = vi.mocked(auth.api.getSession)
const mockGetChats = vi.mocked(getChatsByUserIdPaginated)
const mockDeleteChat = vi.mocked(deleteChat)

function makeRequest(url: string, options?: RequestInit) {
  return new Request(`http://localhost${url}`, options)
}

describe('gET /api/history', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const req = makeRequest('/api/history')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('uses default limit of 20', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockGetChats.mockResolvedValue([])
    const req = makeRequest('/api/history')
    await GET(req)
    expect(mockGetChats).toHaveBeenCalledWith('user-1', 20, undefined)
  })

  it('caps limit at 50', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockGetChats.mockResolvedValue([])
    const req = makeRequest('/api/history?limit=100')
    await GET(req)
    expect(mockGetChats).toHaveBeenCalledWith('user-1', 50, undefined)
  })

  it('sets hasMore true when result count equals limit', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    const chats = Array.from({ length: 20 }, (_, i) => ({
      id: `chat-${i}`,
      title: `Chat ${i}`,
      userId: 'user-1',
      visibility: 'private' as const,
      createdAt: new Date(),
    }))
    mockGetChats.mockResolvedValue(chats)
    const req = makeRequest('/api/history')
    const res = await GET(req)
    const body = await res.json()
    expect(body.hasMore).toBe(true)
  })

  it('sets hasMore false when result count is less than limit', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockGetChats.mockResolvedValue([
      { id: 'chat-1', title: 'Chat', userId: 'user-1', visibility: 'private' as const, createdAt: new Date() },
    ])
    const req = makeRequest('/api/history')
    const res = await GET(req)
    const body = await res.json()
    expect(body.hasMore).toBe(false)
  })
})

describe('dELETE /api/history', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const req = makeRequest('/api/history', {
      method: 'DELETE',
      body: JSON.stringify({ chatId: crypto.randomUUID() }),
    })
    const res = await DELETE(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid chatId format', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    const req = makeRequest('/api/history', {
      method: 'DELETE',
      body: JSON.stringify({ chatId: 'not-a-uuid' }),
    })
    const res = await DELETE(req)
    expect(res.status).toBe(400)
  })

  it('calls deleteChat with userId binding', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockDeleteChat.mockResolvedValue()
    const chatId = crypto.randomUUID()
    const req = makeRequest('/api/history', {
      method: 'DELETE',
      body: JSON.stringify({ chatId }),
    })
    const res = await DELETE(req)
    expect(res.status).toBe(204)
    expect(mockDeleteChat).toHaveBeenCalledWith(chatId, 'user-1')
  })
})
