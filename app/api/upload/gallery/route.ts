import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users, invitations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { uploadToS3 } from '@/lib/ai/s3';
import { optimizeForGallery } from '@/lib/ai/image-optimizer';
import { isValidImageBuffer } from '@/lib/ai/validation';
import { GALLERY_CONFIG } from '@/lib/ai/constants';
import { logger } from '@/lib/ai/logger';

/**
 * POST /api/upload/gallery
 *
 * 갤러리 이미지 업로드 (다중 파일)
 *
 * FormData:
 * - files: File[] (최대 10장)
 * - invitationId: string
 *
 * 파이프라인: 인증 → 소유권 → 한도 → 파일검증 → Sharp최적화 → S3 → DB
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 인증 확인
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    // 2. 사용자 조회
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { id: true, premiumPlan: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 3. FormData 파싱
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const invitationId = formData.get('invitationId') as string;

    if (!invitationId) {
      return NextResponse.json(
        { error: '청첩장 ID가 필요합니다' },
        { status: 400 }
      );
    }

    if (!files.length) {
      return NextResponse.json(
        { error: '업로드할 파일이 없습니다' },
        { status: 400 }
      );
    }

    if (files.length > GALLERY_CONFIG.MAX_BATCH) {
      return NextResponse.json(
        { error: `한 번에 최대 ${GALLERY_CONFIG.MAX_BATCH}장까지 업로드 가능합니다` },
        { status: 400 }
      );
    }

    // 4. Invitation 소유권 확인
    const invitation = await db.query.invitations.findFirst({
      where: eq(invitations.id, invitationId),
      columns: { id: true, userId: true, galleryImages: true },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: '청첩장을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    if (invitation.userId !== user.id) {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      );
    }

    // 5. Tier별 한도 체크
    const limit =
      user.premiumPlan === 'PREMIUM'
        ? GALLERY_CONFIG.PREMIUM_LIMIT
        : GALLERY_CONFIG.FREE_LIMIT;
    const currentCount = invitation.galleryImages?.length ?? 0;
    const available = limit - currentCount;

    if (available <= 0) {
      return NextResponse.json(
        {
          error: `갤러리 한도 초과 (현재 ${currentCount}/${limit}장)`,
          limit,
          current: currentCount,
        },
        { status: 400 }
      );
    }

    // 남은 슬롯만큼만 처리
    const filesToProcess = files.slice(0, available);

    // 6. 파일별 처리 (병렬)
    const results = await Promise.allSettled(
      filesToProcess.map(async (file) => {
        // MIME 타입 검증
        if (
          !GALLERY_CONFIG.ALLOWED_MIME_TYPES.includes(file.type as any)
        ) {
          throw new Error(`지원하지 않는 형식: ${file.type}`);
        }

        // 파일 크기 검증
        if (file.size > GALLERY_CONFIG.MAX_FILE_SIZE) {
          throw new Error(
            `파일 크기 초과: ${(file.size / 1024 / 1024).toFixed(1)}MB (최대 10MB)`
          );
        }

        // 바이너리 시그니처 검증
        const buffer = Buffer.from(await file.arrayBuffer());
        if (!isValidImageBuffer(buffer)) {
          throw new Error('유효하지 않은 이미지 파일');
        }

        // Sharp 최적화 (WebP 변환, 리사이징)
        const optimized = await optimizeForGallery(buffer);

        // S3 업로드
        return uploadToS3(optimized, 'image/webp', `gallery/${user.id}`);
      })
    );

    // 7. 결과 집계
    const uploadedUrls: string[] = [];
    const errors: string[] = [];

    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        uploadedUrls.push(result.value.url);
      } else {
        errors.push(
          `${filesToProcess[i].name}: ${result.reason?.message || '업로드 실패'}`
        );
      }
    });

    if (!uploadedUrls.length) {
      return NextResponse.json(
        { error: '모든 파일 업로드 실패', details: errors },
        { status: 500 }
      );
    }

    // 8. DB 업데이트 — Transaction으로 read-modify-write 원자성 보장
    const { totalCount } = await db.transaction(async (tx) => {
      const current = await tx.query.invitations.findFirst({
        where: eq(invitations.id, invitationId),
        columns: { galleryImages: true },
      });

      const updatedImages = [
        ...(current?.galleryImages ?? []),
        ...uploadedUrls,
      ];

      await tx
        .update(invitations)
        .set({
          galleryImages: updatedImages,
          updatedAt: new Date(),
        })
        .where(eq(invitations.id, invitationId));

      return { totalCount: updatedImages.length };
    });

    // 9. 응답
    return NextResponse.json({
      success: true,
      data: {
        urls: uploadedUrls,
        count: uploadedUrls.length,
        total: totalCount,
        limit,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    logger.error('Gallery upload failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: '갤러리 업로드 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
