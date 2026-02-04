import { Redis } from '@upstash/redis';
import { env } from './env';
import { AI_CONFIG } from './constants';

const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

/**
 * Rate limiting (Lua 스크립트로 원자성 보장)
 */
export async function rateLimit(userId: string): Promise<boolean> {
  const key = `ratelimit:ai:${userId}`;
  const limit = AI_CONFIG.RATE_LIMIT_REQUESTS;
  const window = AI_CONFIG.RATE_LIMIT_WINDOW;

  // Lua 스크립트로 INCR + EXPIRE 원자적 실행
  const script = `
    local current = redis.call('INCR', KEYS[1])
    if current == 1 then
      redis.call('EXPIRE', KEYS[1], ARGV[1])
    end
    return current
  `;

  const count = (await redis.eval(script, [key], [window])) as number;
  return count <= limit;
}
