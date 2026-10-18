type Hit = { ok: true; remaining: number } | { ok: false; remaining: 0 };

export function createMemoryLimiter(limit: number, windowMs: number) {
  const buckets = new Map<string, number[]>();
  return {
    async limit(key: string, now = Date.now()): Promise<Hit> {
      const hits = (buckets.get(key) ?? []).filter((stamp) => now - stamp < windowMs);
      if (hits.length >= limit) {
        buckets.set(key, hits);
        return { ok: false, remaining: 0 };
      }
      hits.push(now);
      buckets.set(key, hits);
      return { ok: true, remaining: limit - hits.length };
    },
  };
}

const memoryLimiter = createMemoryLimiter(8, 10 * 60 * 1000);

export async function limitBrief(userId: string): Promise<Hit> {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { Redis } = await import("@upstash/redis");
    const ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(8, "10 m"),
      prefix: "bordermath-brief",
    });
    const result = await ratelimit.limit(userId);
    return result.success ? { ok: true, remaining: result.remaining } : { ok: false, remaining: 0 };
  }
  return memoryLimiter.limit(userId);
}
