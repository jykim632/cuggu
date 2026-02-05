import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users, aiGenerations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { checkCreditsFromUser, deductCredits, refundCredits } from '@/lib/ai/credits';
import { detectFace } from '@/lib/ai/face-detection';
import { uploadToS3, copyToS3 } from '@/lib/ai/s3';
import { generateWeddingPhotos, AIStyle } from '@/lib/ai/replicate';
import { rateLimit } from '@/lib/ai/rate-limit';
import { isValidImageBuffer } from '@/lib/ai/validation';
import { z } from 'zod';
import { AI_CONFIG } from '@/lib/ai/constants';
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
    const role = formData.get('role') as string;
    const model = formData.get('model') as string | null;

    if (!image || !styleRaw || !role) {
      return NextResponse.json(
        { error: 'Image, style, and role are required' },
        { status: 400 }
      );
    }

    if (role !== 'GROOM' && role !== 'BRIDE') {
      return NextResponse.json(
        { error: 'Role must be GROOM or BRIDE' },
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

    // 이미지 버퍼 변환
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 파일 시그니처 검증 (Magic Number)
    if (!isValidImageBuffer(buffer)) {
      return NextResponse.json(
        { error: '유효하지 않은 이미지 파일입니다' },
        { status: 400 }
      );
    }

    // 6. 크레딧 확인 (개발 모드는 스킵)
    const isDev = process.env.NODE_ENV === 'development';
    if (!isDev) {
      const { hasCredits, balance } = checkCreditsFromUser(user);
      if (!hasCredits) {
        return NextResponse.json(
          { error: 'Insufficient credits', balance },
          { status: 402 } // Payment Required
        );
      }
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
      const result = await uploadToS3(buffer, image.type, 'ai-originals');
      originalUrl = result.url;
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
      const result = await generateWeddingPhotos(
        originalUrl,
        styleData,
        role as 'GROOM' | 'BRIDE',
        model || undefined
      );
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

    // 12. 생성된 이미지를 S3로 복사 (Replicate CDN → S3 영구 저장)
    const s3CopyResults = await Promise.allSettled(
      generatedUrls.map((url) =>
        copyToS3(url, `ai-generated/${user.id}`)
      )
    );

    // S3 복사 성공 시 URL 교체, 실패 시 Replicate URL 유지
    const persistedUrls = generatedUrls.map((replicateUrl, i) => {
      const result = s3CopyResults[i];
      return result.status === 'fulfilled' ? result.value.url : replicateUrl;
    });

    // 13. 생성 이력 저장
    const [generation] = await db
      .insert(aiGenerations)
      .values({
        userId: user.id,
        originalUrl,
        style: styleData,
        generatedUrls: persistedUrls,
        status: 'COMPLETED',
        creditsUsed: 1,
        cost,
        replicateId,
        completedAt: new Date(),
      })
      .returning();

    // 14. 잔여 크레딧 조회 (개발 모드는 999)
    let remainingCredits = 999;
    if (!isDev) {
      const updatedUser = await db.query.users.findFirst({
        where: eq(users.id, user.id),
        columns: { aiCredits: true },
      });
      remainingCredits = updatedUser?.aiCredits ?? 0;
    }

    // 15. 응답
    return NextResponse.json({
      success: true,
      data: {
        id: generation.id,
        originalUrl: generation.originalUrl,
        generatedUrls: generation.generatedUrls,
        style: generation.style,
        remainingCredits,
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
