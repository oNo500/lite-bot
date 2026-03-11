import { isToday, isYesterday, subDays, isAfter } from 'date-fns'

import type { Chat } from '@/db/chat-queries'

export type DateGroup = 'Today' | 'Yesterday' | 'Last 7 days' | 'Last 30 days' | 'Older'
export type GroupedChats = { label: DateGroup, chats: Chat[] }[]

const GROUP_ORDER: DateGroup[] = ['Today', 'Yesterday', 'Last 7 days', 'Last 30 days', 'Older']

function getGroup(date: Date): DateGroup {
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  if (isAfter(date, subDays(new Date(), 7))) return 'Last 7 days'
  if (isAfter(date, subDays(new Date(), 30))) return 'Last 30 days'
  return 'Older'
}

export function groupChatsByDate(chats: Chat[]): GroupedChats {
  const map = new Map<DateGroup, Chat[]>()

  for (const chat of chats) {
    const label = getGroup(chat.createdAt)
    const existing = map.get(label)
    if (existing) {
      existing.push(chat)
    } else {
      map.set(label, [chat])
    }
  }

  return GROUP_ORDER.filter((label) => map.has(label)).map((label) => ({
    label,
    chats: map.get(label)!,
  }))
}
