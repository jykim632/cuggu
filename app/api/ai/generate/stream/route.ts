import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users, aiGenerations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { checkCreditsFromUser, deductCredits, refundCredits } from '@/lib/ai/credits';
import { detectFace } from '@/lib/ai/face-detection';
import { uploadToS3, copyToS3 } from '@/lib/ai/s3';
import { generateWeddingPhotosStream, AIStyle } from '@/lib/ai/replicate';
import { rateLimit } from '@/lib/ai/rate-limit';
import { isValidImageBuffer } from '@/lib/ai/validation';
import { z } from 'zod';
import { AI_CONFIG } from '@/lib/ai/constants';
import { logger } from '@/lib/ai/logger';

const AIStyleSchema = z.enum([
  'CLASSIC',
  'MODERN',
  'VINTAGE',
  'ROMANTIC',
  'CINEMATIC',
]);

const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * SSE 스트리밍 AI 생성 API
 * 이미지가 1장씩 생성될 때마다 클라이언트로 전송
 */
export async function POST(request: NextRequest) {
  let userId: string | undefined;
  let style: string | undefined;
  let creditsDeducted = false;

  // SSE 스트림 설정
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const sendEvent = async (type: string, data: any) => {
    const message = `data: ${JSON.stringify({ type, ...data })}\n\n`;
    await writer.write(encoder.encode(message));
  };

  // 비동기로 생성 처리
  (async () => {
    try {
      // 1. 인증 확인
      const session = await auth();
      if (!session?.user?.email) {
        await sendEvent('error', { error: 'Unauthorized' });
        await writer.close();
        return;
      }

      // 2. 사용자 조회
      const user = await db.query.users.findFirst({
        where: eq(users.email, session.user.email),
      });

      if (!user) {
        await sendEvent('error', { error: 'User not found' });
        await writer.close();
        return;
      }

      userId = user.id;

      // 3. Rate Limiting
      const allowed = await rateLimit(user.id);
      if (!allowed) {
        await sendEvent('error', { error: 'Rate limit exceeded' });
        await writer.close();
        return;
      }

      // 4. FormData 파싱
      const formData = await request.formData();
      const image = formData.get('image') as File;
      const styleRaw = formData.get('style') as string;
      const role = formData.get('role') as string;
      const model = formData.get('model') as string | null;

      if (!image || !styleRaw || !role) {
        await sendEvent('error', { error: 'Image, style, and role are required' });
        await writer.close();
        return;
      }

      if (role !== 'GROOM' && role !== 'BRIDE') {
        await sendEvent('error', { error: 'Role must be GROOM or BRIDE' });
        await writer.close();
        return;
      }

      // Style 검증
      const styleValidation = AIStyleSchema.safeParse(styleRaw);
      if (!styleValidation.success) {
        await sendEvent('error', { error: 'Invalid style' });
        await writer.close();
        return;
      }
      const styleData = styleValidation.data;
      style = styleData;

      // 5. 파일 검증
      if (!AI_CONFIG.ALLOWED_MIME_TYPES.includes(image.type as any)) {
        await sendEvent('error', { error: 'JPG, PNG 파일만 업로드 가능합니다' });
        await writer.close();
        return;
      }

      if (image.size > AI_CONFIG.MAX_FILE_SIZE) {
        await sendEvent('error', { error: 'File too large (max 10MB)' });
        await writer.close();
        return;
      }

      const arrayBuffer = await image.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (!isValidImageBuffer(buffer)) {
        await sendEvent('error', { error: '유효하지 않은 이미지 파일입니다' });
        await writer.close();
        return;
      }

      // 6. 크레딧 확인
      if (!IS_DEV) {
        const { hasCredits, balance } = checkCreditsFromUser(user);
        if (!hasCredits) {
          await sendEvent('error', { error: 'Insufficient credits', balance });
          await writer.close();
          return;
        }
      }

      // 7. 얼굴 감지
      await sendEvent('status', { message: '얼굴 분석 중...' });
      const faceResult = await detectFace(buffer);
      if (!faceResult.success) {
        await sendEvent('error', { error: faceResult.error });
        await writer.close();
        return;
      }

      // 8. 크레딧 차감
      await deductCredits(user.id, 1);
      creditsDeducted = true;

      // 9. S3 업로드
      await sendEvent('status', { message: '이미지 준비 중...' });
      let originalUrl: string;
      try {
        const result = await uploadToS3(buffer, image.type, 'ai-originals');
        originalUrl = result.url;
      } catch (error) {
        await refundCredits(user.id, 1);
        await sendEvent('error', { error: 'S3 업로드 실패' });
        await writer.close();
        return;
      }

      // 10. AI 생성 (스트리밍)
      await sendEvent('status', { message: 'AI 사진 생성 시작...', total: AI_CONFIG.BATCH_SIZE });

      const persistedUrls: string[] = [];

      try {
        const result = await generateWeddingPhotosStream(
          originalUrl,
          styleData,
          role as 'GROOM' | 'BRIDE',
          async (index, replicateUrl) => {
            // S3로 복사
            let finalUrl = replicateUrl;
            try {
              const s3Result = await copyToS3(replicateUrl, `ai-generated/${user.id}`);
              finalUrl = s3Result.url;
            } catch {
              // S3 복사 실패 시 Replicate URL 사용
            }

            persistedUrls[index] = finalUrl;

            // 클라이언트로 이미지 전송
            await sendEvent('image', {
              index,
              url: finalUrl,
              progress: index + 1,
              total: AI_CONFIG.BATCH_SIZE,
            });
          },
          model || undefined
        );

        // 11. DB 저장
        const [generation] = await db
          .insert(aiGenerations)
          .values({
            userId: user.id,
            originalUrl,
            style: styleData,
            generatedUrls: persistedUrls,
            status: 'COMPLETED',
            creditsUsed: 1,
            cost: result.cost,
            replicateId: result.replicateId,
            completedAt: new Date(),
          })
          .returning();

        // 12. 완료
        const remainingCredits = IS_DEV ? 999 : (
          await db.query.users.findFirst({
            where: eq(users.id, user.id),
            columns: { aiCredits: true },
          })
        )?.aiCredits ?? 0;

        await sendEvent('done', {
          id: generation.id,
          originalUrl,
          generatedUrls: persistedUrls,
          style: styleData,
          remainingCredits,
        });

      } catch (error) {
        // AI 생성 실패 시 환불
        await refundCredits(user.id, 1);

        await db.insert(aiGenerations).values({
          userId: user.id,
          originalUrl,
          style: styleData,
          status: 'FAILED',
          creditsUsed: 0,
          cost: 0,
        });

        logger.error('AI generation failed', {
          userId,
          style,
          error: error instanceof Error ? error.message : String(error),
        });

        await sendEvent('error', {
          error: error instanceof Error ? error.message : 'AI 생성 실패'
        });
      }

    } catch (error) {
      logger.error('Stream error', {
        userId,
        style,
        error: error instanceof Error ? error.message : String(error),
      });

      await sendEvent('error', { error: '서버 오류가 발생했습니다' });
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
