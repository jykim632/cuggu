import type { Redis } from '@upstash/redis';
import { db } from '@/db';
import { invitations } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getRedis } from '@/lib/rate-limit';

const CACHE_KEY_PREFIX = 'inv:data:';
const VIEW_KEY_PREFIX = 'inv:views:';
const CACHE_TTL = 300; // 5분
const VIEW_FLUSH_THRESHOLD = 50; // N회 누적 시 DB flush

type CachedInvitation = Awaited<
  ReturnType<typeof db.query.invitations.findFirst<{
    with: { template: true; user: { columns: { premiumPlan: true } } };
  }>>
>;

/** Redis 인스턴스 안전하게 가져오기. 실패 시 null 반환 */
function getSafeRedis(): Redis | null {
  try {
    return getRedis();
  } catch {
    return null;
  }
}

/**
 * 청첩장 데이터 캐시 조회
 * PUBLISHED → Redis 캐시 (TTL 5분), 그 외 → DB 직접
 * 캐시 레이어는 절대 throw하지 않음 — 실패 시 undefined 반환
 */
export async function getInvitationCached(id: string): Promise<CachedInvitation | undefined> {
  try {
    const redis = getSafeRedis();

    if (redis) {
      try {
        const cached = await redis.get<CachedInvitation>(`${CACHE_KEY_PREFIX}${id}`);
        if (cached) return cached;
      } catch {
        // Redis 실패 → DB fallback
      }
    }

    const invitation = await db.query.invitations.findFirst({
      where: eq(invitations.id, id),
      with: { template: true, user: { columns: { premiumPlan: true } } },
    });

    if (redis && invitation && invitation.status === 'PUBLISHED') {
      try {
        await redis.set(`${CACHE_KEY_PREFIX}${id}`, invitation, { ex: CACHE_TTL });
      } catch {
        // 캐시 저장 실패는 무시
      }
    }

    return invitation;
  } catch (e) {
    console.error('[invitation-cache] getInvitationCached failed:', e);
    return undefined;
  }
}

/**
 * OG 메타용 경량 캐시 조회 (relations 없이)
 * 실패 시 undefined 반환
 */
export async function getInvitationMetaCached(id: string) {
  try {
    const redis = getSafeRedis();
    const cacheKey = `inv:meta:${id}`;

    if (redis) {
      try {
        const cached = await redis.get<{
          status: string;
          groomName: string;
          brideName: string;
          introMessage: string | null;
          galleryImages: string[] | null;
          aiPhotoUrl: string | null;
        }>(cacheKey);
        if (cached) return cached;
      } catch {
        // Redis 실패 → DB fallback
      }
    }

    const invitation = await db.query.invitations.findFirst({
      where: eq(invitations.id, id),
    });

    if (redis && invitation && invitation.status === 'PUBLISHED') {
      const meta = {
        status: invitation.status,
        groomName: invitation.groomName,
        brideName: invitation.brideName,
        introMessage: invitation.introMessage,
        galleryImages: invitation.galleryImages,
        aiPhotoUrl: invitation.aiPhotoUrl,
      };
      try {
        await redis.set(cacheKey, meta, { ex: CACHE_TTL });
      } catch {
        // 캐시 저장 실패는 무시
      }
      return meta;
    }

    return invitation;
  } catch (e) {
    console.error('[invitation-cache] getInvitationMetaCached failed:', e);
    return undefined;
  }
}

/**
 * 조회수 증가 (Redis INCR → lazy flush)
 * Redis/DB 모두 실패해도 throw하지 않음
 */
export async function incrementViewCount(id: string): Promise<void> {
  try {
    const redis = getSafeRedis();
    const viewKey = `${VIEW_KEY_PREFIX}${id}`;

    if (redis) {
      try {
        const count = await redis.incr(viewKey);

        if (count >= VIEW_FLUSH_THRESHOLD) {
          await redis.del(viewKey);
          await db
            .update(invitations)
            .set({ viewCount: sql`${invitations.viewCount} + ${count}` })
            .where(eq(invitations.id, id));
        } else if (count === 1) {
          await redis.expire(viewKey, 600);
        }
        return;
      } catch {
        // Redis 실패 → DB direct fallback
      }
    }

    await db
      .update(invitations)
      .set({ viewCount: sql`${invitations.viewCount} + 1` })
      .where(eq(invitations.id, id));
  } catch (e) {
    console.error('[invitation-cache] incrementViewCount failed:', e);
  }
}

/**
 * 캐시 무효화 (에디터 저장/발행/삭제 시 호출)
 * 실패해도 TTL로 자연 만료되므로 throw하지 않음
 */
export async function invalidateInvitationCache(id: string): Promise<void> {
  try {
    const redis = getSafeRedis();
    if (!redis) return;

    await redis.del(`${CACHE_KEY_PREFIX}${id}`, `inv:meta:${id}`);
  } catch (e) {
    console.error('[invitation-cache] invalidateInvitationCache failed:', e);
  }
}

/**
 * 조회수 Redis → DB flush (수동 flush용)
 * 실패 시 로그만 남기고 throw하지 않음
 */
export async function flushViewCount(id: string): Promise<void> {
  try {
    const redis = getSafeRedis();
    if (!redis) return;

    const viewKey = `${VIEW_KEY_PREFIX}${id}`;
    const count = await redis.get<number>(viewKey);

    if (count && count > 0) {
      await redis.del(viewKey);
      await db
        .update(invitations)
        .set({ viewCount: sql`${invitations.viewCount} + ${count}` })
        .where(eq(invitations.id, id));
    }
  } catch (e) {
    console.error('[invitation-cache] flushViewCount failed:', e);
  }
}
