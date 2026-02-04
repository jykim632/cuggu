import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users, aiGenerations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { checkCredits, deductCredits, refundCredits } from '@/lib/ai/credits';
import { detectFace } from '@/lib/ai/face-detection';
import { uploadToS3 } from '@/lib/ai/s3';
import { generateWeddingPhotos, AIStyle } from '@/lib/ai/replicate';
import { rateLimit } from '@/lib/ai/rate-limit';

export async function POST(request: NextRequest) {
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
    const style = formData.get('style') as AIStyle;

    if (!image || !style) {
      return NextResponse.json(
        { error: 'Image and style are required' },
        { status: 400 }
      );
    }

    // 5. 파일 검증
    if (!image.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      );
    }

    if (image.size > 10 * 1024 * 1024) {
      // 10MB
      return NextResponse.json(
        { error: 'File too large (max 10MB)' },
        { status: 400 }
      );
    }

    // 6. 크레딧 확인
    const { hasCredits, balance } = await checkCredits(user.id);
    if (!hasCredits) {
      return NextResponse.json(
        { error: 'Insufficient credits', balance },
        { status: 402 } // Payment Required
      );
    }

    // 7. 이미지 버퍼 변환
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 8. 얼굴 감지
    const faceResult = await detectFace(buffer);
    if (!faceResult.success) {
      return NextResponse.json({ error: faceResult.error }, { status: 400 });
    }

    // 9. 크레딧 차감 (트랜잭션)
    await deductCredits(user.id, 1);

    // 10. 원본 이미지 S3 업로드
    let originalUrl: string;
    try {
      originalUrl = await uploadToS3(buffer, image.type, 'ai-originals');
    } catch (error) {
      // 업로드 실패 시 크레딧 환불
      await refundCredits(user.id, 1);
      throw error;
    }

    // 11. AI 생성 요청
    let generatedUrls: string[];
    let replicateId: string;
    let cost: number;

    try {
      const result = await generateWeddingPhotos(originalUrl, style);
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
        style,
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
        style,
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
    console.error('AI generation error:', error);
    return NextResponse.json(
      { error: 'AI 생성 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
