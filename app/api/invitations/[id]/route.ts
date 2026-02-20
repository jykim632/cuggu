import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { invitations } from '@/db/schema';
import { UpdateInvitationSchema, ExtendedDataSchema } from '@/schemas/invitation';
import { dbRecordToInvitation, invitationToDbUpdate } from '@/lib/invitation-utils';
import { invalidateInvitationCache } from '@/lib/invitation-cache';
import { getInvitationUrl } from '@/lib/kakao-og';
import { extractS3Key, deleteFromS3 } from '@/lib/ai/s3';
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

    // [cuggu-2fr] 발행 시 필수 필드 서버사이드 검증
    if (data.status === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
      const missing: string[] = [];
      // 업데이트 데이터 또는 기존 DB 값에서 확인
      const groomName = data.groom?.name ?? existing.groomName;
      const brideName = data.bride?.name ?? existing.brideName;
      const weddingDate = data.wedding?.date ?? existing.weddingDate;
      const venueName = data.wedding?.venue?.name ?? existing.venueName;

      if (!groomName) missing.push('신랑 이름');
      if (!brideName) missing.push('신부 이름');
      if (!weddingDate) missing.push('예식 날짜');
      if (!venueName) missing.push('예식장 이름');

      if (missing.length > 0) {
        return NextResponse.json(
          { error: '발행에 필요한 정보가 부족합니다', missing },
          { status: 400 }
        );
      }
    }

    // invitationToDbUpdate()로 flat 컬럼 + extendedData 분리
    const dbUpdate = invitationToDbUpdate(data);

    // extendedData deep merge (기존 데이터 보존)
    if (dbUpdate.extendedData) {
      const existingExt = (existing.extendedData as Record<string, any>) || {};
      const merged = {
        ...existingExt,
        ...(dbUpdate.extendedData as Record<string, any>),
        groom: { ...(existingExt.groom || {}), ...((dbUpdate.extendedData as any).groom || {}) },
        bride: { ...(existingExt.bride || {}), ...((dbUpdate.extendedData as any).bride || {}) },
        venue: { ...(existingExt.venue || {}), ...((dbUpdate.extendedData as any).venue || {}) },
        content: { ...(existingExt.content || {}), ...((dbUpdate.extendedData as any).content || {}) },
        gallery: { ...(existingExt.gallery || {}), ...((dbUpdate.extendedData as any).gallery || {}) },
        settings: { ...(existingExt.settings || {}), ...((dbUpdate.extendedData as any).settings || {}) },
        share: { ...(existingExt.share || {}), ...((dbUpdate.extendedData as any).share || {}) },
      };

      // [cuggu-jrk] merge 결과 검증 — 실패 시 기존 데이터 보존
      const extValidation = ExtendedDataSchema.safeParse(merged);
      if (!extValidation.success) {
        return NextResponse.json(
          {
            error: '확장 데이터가 올바르지 않습니다',
            details: extValidation.error.issues,
          },
          { status: 400 }
        );
      }
      dbUpdate.extendedData = extValidation.data;
    }

    const updateData: any = { ...dbUpdate, updatedAt: new Date() };

    const [updated] = await db
      .update(invitations)
      .set(updateData)
      .where(eq(invitations.id, id))
      .returning();

    // 공개 페이지 캐시 무효화
    invalidateInvitationCache(id);

    // 카카오 OG 캐시는 이미지 URL에 ?v={updatedAt} 파라미터로 자동 우회됨
    // (generateMetadata에서 appendOgVersion 적용)

    // 갤러리에서 제거된 이미지 S3 정리 (fire-and-forget)
    if (updateData.galleryImages) {
      const oldImages = new Set((existing.galleryImages as string[]) || []);
      const newImages = new Set(updateData.galleryImages as string[]);
      const removedUrls = [...oldImages].filter((url) => !newImages.has(url));

      if (removedUrls.length > 0) {
        const keys = removedUrls
          .map((url) => extractS3Key(url))
          .filter((k): k is string => k !== null);

        if (keys.length > 0) {
          deleteFromS3(keys).then((count) => {
            console.log(`[Gallery] S3 orphan 삭제: ${count}/${keys.length}`);
          }).catch((err) => {
            console.error('[Gallery] S3 orphan 삭제 실패:', err);
          });
        }
      }
    }

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

    // 공개 페이지 캐시 무효화
    invalidateInvitationCache(id);

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
