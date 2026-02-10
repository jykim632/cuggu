import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { invitations } from '@/db/schema';
import { UpdateInvitationSchema } from '@/schemas/invitation';
import { dbRecordToInvitation, invitationToDbUpdate } from '@/lib/invitation-utils';
import { eq } from 'drizzle-orm';

// GET /api/invitations/[id] - 단건 조회 (권한 체크)
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

    const invitation = await db.query.invitations.findFirst({
      where: eq(invitations.id, id),
      with: {
        template: true,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: '청첩장을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 본인 청첩장만 조회 가능
    if (invitation.userId !== session.user.id) {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      );
    }

    const converted = dbRecordToInvitation(invitation as any);
    return NextResponse.json({
      success: true,
      data: converted,
    });
  } catch (error) {
    console.error('청첩장 조회 실패:', error);
    return NextResponse.json(
      { error: '청첩장 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// PUT /api/invitations/[id] - 수정 (자동 저장용)
export async function PUT(
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

    // 권한 확인
    const existing = await db.query.invitations.findFirst({
      where: eq(invitations.id, id),
    });

    if (!existing) {
      return NextResponse.json(
        { error: '청첩장을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      );
    }

    // 요청 바디 파싱 및 검증
    const body = await req.json();

    // 불완전한 account 객체 제거 (빈 객체 또는 필수 필드 누락)
    const cleanBody = { ...body };
    if (cleanBody.groom?.account && !cleanBody.groom.account.accountNumber) {
      delete cleanBody.groom.account;
    }
    if (cleanBody.bride?.account && !cleanBody.bride.account.accountNumber) {
      delete cleanBody.bride.account;
    }

    const parsed = UpdateInvitationSchema.safeParse(cleanBody);

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

    // invitationToDbUpdate()로 flat 컬럼 + extendedData 분리
    const dbUpdate = invitationToDbUpdate(data);

    // extendedData deep merge (기존 데이터 보존)
    if (dbUpdate.extendedData) {
      const existingExt = (existing.extendedData as Record<string, any>) || {};
      dbUpdate.extendedData = {
        ...existingExt,
        ...(dbUpdate.extendedData as Record<string, any>),
        groom: { ...(existingExt.groom || {}), ...((dbUpdate.extendedData as any).groom || {}) },
        bride: { ...(existingExt.bride || {}), ...((dbUpdate.extendedData as any).bride || {}) },
        venue: { ...(existingExt.venue || {}), ...((dbUpdate.extendedData as any).venue || {}) },
        content: { ...(existingExt.content || {}), ...((dbUpdate.extendedData as any).content || {}) },
        gallery: { ...(existingExt.gallery || {}), ...((dbUpdate.extendedData as any).gallery || {}) },
        settings: { ...(existingExt.settings || {}), ...((dbUpdate.extendedData as any).settings || {}) },
      };
    }

    const updateData: any = { ...dbUpdate, updatedAt: new Date() };

    const [updated] = await db
      .update(invitations)
      .set(updateData)
      .where(eq(invitations.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error('청첩장 수정 실패:', error);
    return NextResponse.json(
      { error: '청첩장 수정 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// DELETE /api/invitations/[id] - 삭제 (soft delete)
export async function DELETE(
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

    // 권한 확인
    const existing = await db.query.invitations.findFirst({
      where: eq(invitations.id, id),
    });

    if (!existing) {
      return NextResponse.json(
        { error: '청첩장을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      );
    }

    // Soft delete (status를 DELETED로 변경)
    await db
      .update(invitations)
      .set({
        status: 'DELETED',
        updatedAt: new Date(),
      })
      .where(eq(invitations.id, id));

    return NextResponse.json({
      success: true,
      message: '청첩장이 삭제되었습니다',
    });
  } catch (error) {
    console.error('청첩장 삭제 실패:', error);
    return NextResponse.json(
      { error: '청첩장 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
