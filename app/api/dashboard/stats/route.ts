import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { invitations, rsvps } from '@/db/schema';
import { eq, and, ne, sql, sum } from 'drizzle-orm';

// GET /api/dashboard/stats - 대시보드 통계 조회
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    // 1. 내 청첩장 개수 (삭제된 것 제외)
    const [{ count: invitationCount }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(invitations)
      .where(
        and(
          eq(invitations.userId, session.user.id),
          ne(invitations.status, 'DELETED')
        )
      );

    // 2. 총 조회수 (내 모든 청첩장의 viewCount 합계)
    const [{ totalViews }] = await db
      .select({
        totalViews: sql<number>`COALESCE(SUM(${invitations.viewCount}), 0)::int`,
      })
      .from(invitations)
      .where(
        and(
          eq(invitations.userId, session.user.id),
          ne(invitations.status, 'DELETED')
        )
      );

    // 3. RSVP 응답 수 (내 청첩장들에 대한 RSVP 개수)
    const [{ rsvpCount }] = await db
      .select({
        rsvpCount: sql<number>`count(*)::int`,
      })
      .from(rsvps)
      .innerJoin(invitations, eq(rsvps.invitationId, invitations.id))
      .where(
        and(
          eq(invitations.userId, session.user.id),
          ne(invitations.status, 'DELETED')
        )
      );

    return NextResponse.json({
      success: true,
      data: {
        invitationCount,
        totalViews,
        rsvpCount,
      },
    });
  } catch (error) {
    console.error('대시보드 통계 조회 실패:', error);
    return NextResponse.json(
      { error: '통계 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
