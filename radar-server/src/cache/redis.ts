import { Redis } from "@upstash/redis"

let redisClient: Redis | null = null

export function getRedis(): Redis | null {
  if (!redisClient) {
    const url = process.env.UPSTASH_REDIS_URL
    const token = process.env.UPSTASH_REDIS_TOKEN
    if (!url || !token) {
      console.warn("Upstash Redis credentials missing. Caching will be disabled.")
      return null
    }
    redisClient = new Redis({ url, token })
  }
  return redisClient
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const client = getRedis()
    if (!client) return null
    return await client.get<T>(key)
  } catch {
    return null
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    const client = getRedis()
    if (!client) return
    if (ttlSeconds === 0) {
      await client.set(key, value)
    } else {
      await client.set(key, value, { ex: ttlSeconds })
    }
  } catch (e) {
    console.error("Cache set failed:", e)
  }
}
