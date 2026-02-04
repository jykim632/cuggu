import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { invitations } from '@/db/schema';
import { UpdateInvitationSchema } from '@/schemas/invitation';
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

    return NextResponse.json({
      success: true,
      data: invitation,
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
    const parsed = UpdateInvitationSchema.safeParse(body);

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

    // DB 업데이트 (부분 업데이트 지원)
    const updateData: any = {
      updatedAt: new Date(),
    };

    // 템플릿 변경
    if (data.templateId !== undefined) {
      updateData.templateId = data.templateId;
    }

    // 신랑 정보
    if (data.groom?.name !== undefined) {
      updateData.groomName = data.groom.name;
    }

    // 신부 정보
    if (data.bride?.name !== undefined) {
      updateData.brideName = data.bride.name;
    }

    // 예식 정보
    if (data.wedding?.date !== undefined) {
      updateData.weddingDate = new Date(data.wedding.date);
      // 만료일도 함께 업데이트 (결혼식 90일 후)
      updateData.expiresAt = new Date(
        new Date(data.wedding.date).getTime() + 90 * 24 * 60 * 60 * 1000
      );
    }
    if (data.wedding?.venue?.name !== undefined) {
      updateData.venueName = data.wedding.venue.name;
    }
    if (data.wedding?.venue?.address !== undefined) {
      updateData.venueAddress = data.wedding.venue.address;
    }

    // 인사말
    if (data.content?.greeting !== undefined) {
      updateData.introMessage = data.content.greeting;
    }

    // 갤러리
    if (data.gallery?.images !== undefined) {
      updateData.galleryImages = data.gallery.images;
    }

    // AI 사진
    if (data.aiPhotoUrl !== undefined) {
      updateData.aiPhotoUrl = data.aiPhotoUrl;
    }

    // 비밀번호 보호
    if (data.isPasswordProtected !== undefined) {
      updateData.isPasswordProtected = data.isPasswordProtected;
    }

    // 상태
    if (data.status !== undefined) {
      updateData.status = data.status;
    }

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
