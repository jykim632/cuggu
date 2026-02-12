import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users, aiReferencePhotos } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { detectFace } from '@/lib/ai/face-detection';
import { uploadToS3 } from '@/lib/ai/s3';
import { isValidImageBuffer } from '@/lib/ai/validation';
import { AI_CONFIG } from '@/lib/ai/constants';
import { logger } from '@/lib/ai/logger';

/**
 * POST /api/ai/reference-photos — 참조 사진 업로드
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 인증
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
      columns: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. FormData 파싱
    const formData = await request.formData();
    const image = formData.get('image') as File | null;
    const role = formData.get('role') as string | null;

    if (!image || !role) {
      return NextResponse.json(
        { error: '사진과 역할(role)은 필수입니다' },
        { status: 400 }
      );
    }

    if (role !== 'GROOM' && role !== 'BRIDE') {
      return NextResponse.json(
        { error: 'role은 GROOM 또는 BRIDE만 가능합니다' },
        { status: 400 }
      );
    }

    // 3. 파일 타입 검증
    if (!AI_CONFIG.ALLOWED_MIME_TYPES.includes(image.type as any)) {
      return NextResponse.json(
        { error: 'JPG, PNG 파일만 업로드 가능합니다' },
        { status: 400 }
      );
    }

    // 4. 파일 크기 검증
    if (image.size > AI_CONFIG.MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: '파일 크기는 10MB 이하만 가능합니다' },
        { status: 400 }
      );
    }

    // 5. 버퍼 변환 및 매직넘버 검증
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!isValidImageBuffer(buffer)) {
      return NextResponse.json(
        { error: '유효하지 않은 이미지 파일입니다' },
        { status: 400 }
      );
    }

    // 6. 얼굴 감지 (non-blocking — 실패해도 업로드 진행)
    let faceDetected = false;
    let faceWarning: string | undefined;
    try {
      const faceResult = await detectFace(buffer);
      faceDetected = faceResult.success;
      if (!faceResult.success) {
        faceWarning = faceResult.error;
      }
    } catch (err) {
      logger.warn('Face detection failed, proceeding anyway', {
        error: err instanceof Error ? err.message : String(err),
      });
      faceWarning = '얼굴 감지를 수행할 수 없었습니다';
    }

    // 7. S3 업로드
    let originalUrl: string;
    try {
      const result = await uploadToS3(buffer, image.type, 'ai-reference-photos');
      originalUrl = result.url;
    } catch (error) {
      logger.error('Reference photo S3 upload failed', {
        userId: user.id,
        error: error instanceof Error ? error.message : String(error),
      });
      return NextResponse.json(
        { error: '사진 업로드에 실패했습니다' },
        { status: 500 }
      );
    }

    // 8. 기존 같은 user+role의 활성 사진 비활성화
    await db
      .update(aiReferencePhotos)
      .set({ isActive: false })
      .where(
        and(
          eq(aiReferencePhotos.userId, user.id),
          eq(aiReferencePhotos.role, role),
          eq(aiReferencePhotos.isActive, true)
        )
      );

    // 9. DB 저장
    const [referencePhoto] = await db
      .insert(aiReferencePhotos)
      .values({
        userId: user.id,
        role,
        originalUrl,
        faceDetected,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: referencePhoto,
      ...(faceWarning && { warning: faceWarning }),
    }, { status: 201 });
  } catch (error) {
    logger.error('Reference photo upload error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/ai/reference-photos — 내 활성 참조 사진 목록
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
      columns: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const photos = await db
      .select()
      .from(aiReferencePhotos)
      .where(
        and(
          eq(aiReferencePhotos.userId, user.id),
          eq(aiReferencePhotos.isActive, true)
        )
      );

    return NextResponse.json({ success: true, data: photos });
  } catch (error) {
    logger.error('Get reference photos error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
