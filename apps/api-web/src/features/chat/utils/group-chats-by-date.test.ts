import { describe, it, expect } from 'vitest'

import { groupChatsByDate } from './group-chats-by-date'

import type { Chat } from '@/db/chat-queries'

function makeChat(overrides: Partial<Chat> & { daysAgo: number }): Chat {
  const { daysAgo, ...rest } = overrides
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return {
    id: crypto.randomUUID(),
    title: 'Test Chat',
    userId: 'user-1',
    visibility: 'private',
    createdAt: date,
    ...rest,
  }
}

describe('groupChatsByDate', () => {
  it('returns empty array for empty input', () => {
    expect(groupChatsByDate([])).toEqual([])
  })

  it('puts today chats in Today group', () => {
    const chat = makeChat({ daysAgo: 0 })
    const groups = groupChatsByDate([chat])
    expect(groups).toHaveLength(1)
    expect(groups[0]?.label).toBe('Today')
    expect(groups[0]?.chats).toContainEqual(chat)
  })

  it('puts yesterday chats in Yesterday group', () => {
    const chat = makeChat({ daysAgo: 1 })
    const groups = groupChatsByDate([chat])
    expect(groups).toHaveLength(1)
    expect(groups[0]?.label).toBe('Yesterday')
    expect(groups[0]?.chats).toContainEqual(chat)
  })

  it('puts 2-6 day old chats in Last 7 days group', () => {
    const chat = makeChat({ daysAgo: 5 })
    const groups = groupChatsByDate([chat])
    expect(groups).toHaveLength(1)
    expect(groups[0]?.label).toBe('Last 7 days')
  })

  it('puts 7-29 day old chats in Last 30 days group', () => {
    const chat = makeChat({ daysAgo: 15 })
    const groups = groupChatsByDate([chat])
    expect(groups).toHaveLength(1)
    expect(groups[0]?.label).toBe('Last 30 days')
  })

  it('puts 30+ day old chats in Older group', () => {
    const chat = makeChat({ daysAgo: 45 })
    const groups = groupChatsByDate([chat])
    expect(groups).toHaveLength(1)
    expect(groups[0]?.label).toBe('Older')
  })

  it('does not include empty groups in result', () => {
    const chat = makeChat({ daysAgo: 0 })
    const groups = groupChatsByDate([chat])
    const labels = groups.map((g) => g.label)
    expect(labels).not.toContain('Yesterday')
    expect(labels).not.toContain('Last 7 days')
    expect(labels).not.toContain('Last 30 days')
    expect(labels).not.toContain('Older')
  })

  it('correctly distributes chats across multiple groups', () => {
    const today = makeChat({ daysAgo: 0 })
    const yesterday = makeChat({ daysAgo: 1 })
    const lastWeek = makeChat({ daysAgo: 5 })
    const lastMonth = makeChat({ daysAgo: 20 })
    const older = makeChat({ daysAgo: 60 })

    const groups = groupChatsByDate([today, yesterday, lastWeek, lastMonth, older])
    expect(groups).toHaveLength(5)

    const groupMap = Object.fromEntries(groups.map((g) => [g.label, g.chats]))
    expect(groupMap.Today).toContainEqual(today)
    expect(groupMap.Yesterday).toContainEqual(yesterday)
    expect(groupMap['Last 7 days']).toContainEqual(lastWeek)
    expect(groupMap['Last 30 days']).toContainEqual(lastMonth)
    expect(groupMap.Older).toContainEqual(older)
  })
})
