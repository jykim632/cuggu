import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * AI 생성 Rate Limiting
 *
 * @param userId - 사용자 ID
 * @returns true if allowed, false if rate limit exceeded
 */
export async function rateLimit(userId: string): Promise<boolean> {
  const key = `ratelimit:ai:${userId}`;
  const limit = 5; // 5회/10분
  const window = 600; // 10분 (초)

  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, window);
  }

  return count <= limit;
}
