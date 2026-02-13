import { Redis } from '@upstash/redis';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      throw new Error(
        'UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required'
      );
    }
    redis = new Redis({ url, token });
  }
  return redis;
}

// Lua 스크립트: INCR + EXPIRE 원자적 실행 (기존 lib/ai/rate-limit.ts와 동일 패턴)
const LUA_RATE_LIMIT = `
  local current = redis.call('INCR', KEYS[1])
  if current == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
  end
  return current
`;

/**
 * 범용 rate limiter (Lua 스크립트로 원자성 보장)
 *
 * @param key - Redis key (예: "ratelimit:api:127.0.0.1")
 * @param limit - 허용 요청 수
 * @param windowSec - 시간 윈도우 (초)
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSec: number
): Promise<{ allowed: boolean; remaining: number }> {
  const r = getRedis();
  const count = (await r.eval(LUA_RATE_LIMIT, [key], [windowSec])) as number;

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
  };
}

/**
 * 요청에서 클라이언트 IP 추출
 * Vercel/CloudFlare 프록시 헤더 우선 사용
 */
export function getClientIp(req: Request): string {
  const forwarded = (req.headers.get('x-forwarded-for') || '')
    .split(',')[0]
    .trim();
  const real = req.headers.get('x-real-ip');
  return forwarded || real || 'unknown';
}
