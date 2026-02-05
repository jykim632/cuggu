import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { invitations, rsvps } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import {
  SubmitRSVPRequestSchema,
  RSVPStatsResponse,
  RSVPResponse,
  maskPhoneNumber,
  maskEmail,
} from '@/schemas/rsvp';

// POST /api/invitations/[id]/rsvp - 게스트 RSVP 제출 (인증 불필요)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 청첩장 확인
    const invitation = await db.query.invitations.findFirst({
      where: eq(invitations.id, id),
    });

    if (!invitation) {
      return NextResponse.json(
        { error: '청첩장을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // PUBLISHED 상태만 RSVP 제출 가능
    if (invitation.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'RSVP를 제출할 수 없는 청첩장입니다' },
        { status: 400 }
      );
    }

    // enableRsvp 설정 확인
    const settings = (invitation.extendedData as any)?.settings || {};
    if (settings.enableRsvp === false) {
      return NextResponse.json(
        { error: 'RSVP가 비활성화된 청첩장입니다' },
        { status: 400 }
      );
    }

    // 요청 바디 파싱 및 검증
    const body = await req.json();
    const parsed = SubmitRSVPRequestSchema.omit({ invitationId: true }).safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: '입력 데이터가 올바르지 않습니다',
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // RSVP 저장
    const [created] = await db
      .insert(rsvps)
      .values({
        invitationId: id,
        guestName: data.guestName,
        guestPhone: data.guestPhone || null,
        guestEmail: data.guestEmail || null,
        attendance: data.attendance,
        guestCount: data.guestCount,
        mealOption: data.mealOption || null,
        message: data.message || null,
      })
      .returning({ id: rsvps.id, submittedAt: rsvps.submittedAt });

    return NextResponse.json({
      success: true,
      data: {
        id: created.id,
        submittedAt: created.submittedAt,
      },
    });
  } catch (error) {
    console.error('RSVP 제출 실패:', error);
    return NextResponse.json(
      { error: 'RSVP 제출 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// GET /api/invitations/[id]/rsvp - 소유자용 RSVP 목록 + 통계 (인증 필요)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    // 청첩장 확인 + 소유권 체크
    const invitation = await db.query.invitations.findFirst({
      where: eq(invitations.id, id),
    });

    if (!invitation) {
      return NextResponse.json(
        { error: '청첩장을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    if (invitation.userId !== session.user.id) {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      );
    }

    // RSVP 목록 조회
    const rsvpList = await db.query.rsvps.findMany({
      where: eq(rsvps.invitationId, id),
      orderBy: (rsvps, { desc }) => [desc(rsvps.submittedAt)],
    });

    // 통계 계산
    const stats: RSVPStatsResponse = {
      total: rsvpList.length,
      attending: 0,
      notAttending: 0,
      maybe: 0,
      totalGuests: 0,
      mealStats: {
        adult: 0,
        child: 0,
        vegetarian: 0,
        none: 0,
      },
    };

    for (const rsvp of rsvpList) {
      if (rsvp.attendance === 'ATTENDING') {
        stats.attending++;
        stats.totalGuests += rsvp.guestCount;

        // 식사 옵션 카운트 (참석자만)
        if (rsvp.mealOption) {
          const key = rsvp.mealOption.toLowerCase() as keyof typeof stats.mealStats;
          if (key in stats.mealStats) {
            stats.mealStats[key] += rsvp.guestCount;
          }
        }
      } else if (rsvp.attendance === 'NOT_ATTENDING') {
        stats.notAttending++;
      } else if (rsvp.attendance === 'MAYBE') {
        stats.maybe++;
      }
    }

    // 민감 정보 마스킹
    const maskedRsvps: RSVPResponse[] = rsvpList.map((rsvp) => ({
      id: rsvp.id,
      invitationId: rsvp.invitationId,
      guestName: rsvp.guestName,
      guestPhoneMasked: rsvp.guestPhone ? maskPhoneNumber(rsvp.guestPhone) : undefined,
      guestEmailMasked: rsvp.guestEmail ? maskEmail(rsvp.guestEmail) : undefined,
      attendance: rsvp.attendance,
      guestCount: rsvp.guestCount,
      mealOption: rsvp.mealOption,
      message: rsvp.message,
      submittedAt: rsvp.submittedAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        rsvps: maskedRsvps,
        stats,
        invitationId: id,
      },
    });
  } catch (error) {
    console.error('RSVP 목록 조회 실패:', error);
    return NextResponse.json(
      { error: 'RSVP 목록 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
