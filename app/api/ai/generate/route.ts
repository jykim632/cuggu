import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users, aiGenerations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { checkCreditsFromUser, deductCredits, refundCredits } from '@/lib/ai/credits';
import { detectFace } from '@/lib/ai/face-detection';
import { uploadToS3 } from '@/lib/ai/s3';
import { generateWeddingPhotos, AIStyle } from '@/lib/ai/replicate';
import { rateLimit } from '@/lib/ai/rate-limit';
import { z } from 'zod';
import { AI_CONFIG, FILE_SIGNATURES } from '@/lib/ai/constants';
import { logger } from '@/lib/ai/logger';

// Style 런타임 검증 스키마
const AIStyleSchema = z.enum([
  'CLASSIC',
  'MODERN',
  'VINTAGE',
  'ROMANTIC',
  'CINEMATIC',
]);

export async function POST(request: NextRequest) {
  let userId: string | undefined;
  let style: string | undefined;

  try {
    // 1. 인증 확인
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. 사용자 조회
    const user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    userId = user.id;

    // 3. Rate Limiting 확인
    const allowed = await rateLimit(user.id);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // 4. FormData 파싱
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const styleRaw = formData.get('style') as string;

    if (!image || !styleRaw) {
      return NextResponse.json(
        { error: 'Image and style are required' },
        { status: 400 }
      );
    }

    // Style 검증
    const styleValidation = AIStyleSchema.safeParse(styleRaw);
    if (!styleValidation.success) {
      return NextResponse.json(
        {
          error:
            'Invalid style. Must be one of: CLASSIC, MODERN, VINTAGE, ROMANTIC, CINEMATIC',
        },
        { status: 400 }
      );
    }
    const styleData = styleValidation.data;
    style = styleData;

    // 5. 파일 검증
    if (!AI_CONFIG.ALLOWED_MIME_TYPES.includes(image.type as any)) {
      return NextResponse.json(
        { error: 'JPG, PNG 파일만 업로드 가능합니다' },
        { status: 400 }
      );
    }

    if (image.size > AI_CONFIG.MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large (max 10MB)' },
        { status: 400 }
      );
    }

    // TODO: Sharp 라이브러리로 이미지 압축
    // - 10MB 원본 → 800x800 리사이징, quality 85
    // - S3 비용 절감 + Replicate 처리 속도 향상
    // - pnpm add sharp

    // 이미지 버퍼 변환 (파일 시그니처 검증 위해 먼저 실행)
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 파일 시그니처 검증 (Magic Number)
    const isPNG =
      buffer[0] === FILE_SIGNATURES.PNG[0] &&
      buffer[1] === FILE_SIGNATURES.PNG[1] &&
      buffer[2] === FILE_SIGNATURES.PNG[2] &&
      buffer[3] === FILE_SIGNATURES.PNG[3];

    const isJPEG =
      buffer[0] === FILE_SIGNATURES.JPEG_START[0] &&
      buffer[1] === FILE_SIGNATURES.JPEG_START[1] &&
      buffer[2] === FILE_SIGNATURES.JPEG_START[2];

    if (!isPNG && !isJPEG) {
      return NextResponse.json(
        { error: '유효하지 않은 이미지 파일입니다' },
        { status: 400 }
      );
    }

    // 6. 크레딧 확인
    const { hasCredits, balance } = checkCreditsFromUser(user);
    if (!hasCredits) {
      return NextResponse.json(
        { error: 'Insufficient credits', balance },
        { status: 402 } // Payment Required
      );
    }

    // 8. 얼굴 감지
    const faceResult = await detectFace(buffer);
    if (!faceResult.success) {
      return NextResponse.json({ error: faceResult.error }, { status: 400 });
    }

    // TODO: Drizzle 트랜잭션으로 크레딧 차감~이력 저장 묶기
    // await db.transaction(async (tx) => {
    //   await deductCredits(user.id, 1, tx);
    //   ... S3 업로드, AI 생성
    //   await tx.insert(aiGenerations).values(...);
    // });
    // 이유: 트랜잭션으로 묶으면 S3/Replicate 외부 API 실패 시 롤백 복잡. 현재 환불 로직이 더 명확.

    // 9. 크레딧 차감 (트랜잭션)
    await deductCredits(user.id, 1);

    // 10. 원본 이미지 S3 업로드
    let originalUrl: string;
    try {
      originalUrl = await uploadToS3(buffer, image.type, 'ai-originals');
    } catch (error) {
      // 업로드 실패 시 크레딧 환불
      await refundCredits(user.id, 1);

      // 실패 이력 저장
      await db.insert(aiGenerations).values({
        userId: user.id,
        originalUrl: '', // S3 실패 시 빈 문자열
        style: styleData,
        status: 'FAILED',
        creditsUsed: 0,
        cost: 0,
      });

      console.error('S3 upload error:', error);
      return NextResponse.json(
        { error: 'S3 업로드 실패. 잠시 후 다시 시도해주세요.' },
        { status: 500 }
      );
    }

    // 11. AI 생성 요청
    let generatedUrls: string[];
    let replicateId: string;
    let cost: number;

    try {
      const result = await generateWeddingPhotos(originalUrl, styleData);
      generatedUrls = result.urls;
      replicateId = result.replicateId;
      cost = result.cost;
    } catch (error) {
      // AI 생성 실패 시 크레딧 환불
      await refundCredits(user.id, 1);

      // 생성 실패 이력 저장
      await db.insert(aiGenerations).values({
        userId: user.id,
        originalUrl,
        style: styleData,
        status: 'FAILED',
        creditsUsed: 0, // 환불됨
        cost: 0,
      });

      throw error;
    }

    // 12. 생성 이력 저장
    const [generation] = await db
      .insert(aiGenerations)
      .values({
        userId: user.id,
        originalUrl,
        style: styleData,
        generatedUrls,
        status: 'COMPLETED',
        creditsUsed: 1,
        cost,
        replicateId,
        completedAt: new Date(),
      })
      .returning();

    // 13. 응답
    return NextResponse.json({
      success: true,
      data: {
        id: generation.id,
        originalUrl: generation.originalUrl,
        generatedUrls: generation.generatedUrls,
        style: generation.style,
        remainingCredits: balance - 1,
      },
    });
  } catch (error) {
    logger.error('AI generation failed', {
      userId,
      style,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: 'AI 생성 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
