import { Redis } from "@upstash/redis"

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
})

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    return await redis.get<T>(key)
  } catch {
    return null
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    if (ttlSeconds === 0) {
      await redis.set(key, value)
    } else {
      await redis.set(key, value, { ex: ttlSeconds })
    }
  } catch (e) {
    console.error("Cache set failed:", e)
  }
}
