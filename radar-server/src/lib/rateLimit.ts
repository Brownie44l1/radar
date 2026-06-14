const buckets = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(
  key: string,
  maxRequests: number = 10,
  windowSeconds: number = 60,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 })
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowSeconds * 1000 }
  }

  bucket.count++
  if (bucket.count > maxRequests) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt }
  }

  return { allowed: true, remaining: maxRequests - bucket.count, resetAt: bucket.resetAt }
}
