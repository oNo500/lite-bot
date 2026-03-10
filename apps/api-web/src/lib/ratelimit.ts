import { env } from '@/config/env'

// Sliding window rate limit via Redis sorted set
// 10 requests per 60 seconds per IP
const WINDOW_MS = 60_000
const MAX_REQUESTS = 10

import type { Redis as RedisType } from 'ioredis'

let redis: RedisType | null = null

async function getRedis() {
  if (!env.REDIS_URL) return null
  if (!redis) {
    const { default: Redis } = await import('ioredis')
    redis = new Redis(env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 })
  }
  return redis
}

export async function checkRateLimit(ip: string): Promise<{ allowed: boolean }> {
  const client = await getRedis()
  if (!client) return { allowed: true }

  const key = `rl:${ip}`
  const now = Date.now()
  const windowStart = now - WINDOW_MS

  const count = await client
    .multi()
    .zremrangebyscore(key, '-inf', windowStart)
    .zadd(key, now, `${now}`)
    .zcard(key)
    .pexpire(key, WINDOW_MS)
    .exec()

  const total = (count?.[2]?.[1] as number | null) ?? 0
  return { allowed: total <= MAX_REQUESTS }
}
