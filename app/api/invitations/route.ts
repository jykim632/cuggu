import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { invitations } from '@/db/schema';
import { CreateInvitationSchema } from '@/schemas/invitation';
import { eq, desc, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// POST /api/invitations - 청첩장 생성
export async function POST(req: NextRequest) {
  try {
    // 인증 확인
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    // 요청 바디 파싱
    const body = await req.json();

    // Zod 검증
    const parsed = CreateInvitationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: '입력 데이터가 올바르지 않습니다',
          details: parsed.error.errors,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // nanoid URL 생성 (10자리)
    const invitationId = nanoid(10);

    // DB 저장
    const [invitation] = await db
      .insert(invitations)
      .values({
        id: invitationId,
        userId: session.user.id,
        templateId: data.templateId,

        // 기본 정보 (DB 컬럼에 맞게 평탄화)
        groomName: data.groom.name,
        brideName: data.bride.name,
        weddingDate: new Date(data.wedding.date),
        venueName: data.wedding.venue.name,
        venueAddress: data.wedding.venue.address,

        // 인사말
        introMessage: data.content.greeting || null,

        // 상태
        status: 'DRAFT',
        viewCount: 0,

        // 만료일 (결혼식 90일 후)
        expiresAt: new Date(
          new Date(data.wedding.date).getTime() + 90 * 24 * 60 * 60 * 1000
        ),
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: {
          id: invitation.id,
          url: `/inv/${invitation.id}`,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('청첩장 생성 실패:', error);
    return NextResponse.json(
      { error: '청첩장 생성 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// GET /api/invitations - 청첩장 목록 조회 (본인 것만)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    // 페이지네이션 파라미터
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const offset = (page - 1) * pageSize;

    // 본인 청첩장만 조회 (삭제된 것 제외)
    const userInvitations = await db.query.invitations.findMany({
      where: eq(invitations.userId, session.user.id),
      orderBy: [desc(invitations.createdAt)],
      limit: pageSize,
      offset: offset,
      with: {
        template: true, // 템플릿 정보 포함
      },
    });

    // 전체 개수
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(invitations)
      .where(eq(invitations.userId, session.user.id));

    return NextResponse.json({
      success: true,
      data: {
        invitations: userInvitations,
        total: count,
        page,
        pageSize,
        totalPages: Math.ceil(count / pageSize),
      },
    });
  } catch (error) {
    console.error('청첩장 목록 조회 실패:', error);
    return NextResponse.json(
      { error: '청첩장 목록 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
