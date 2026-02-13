import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users, aiGenerations, aiGenerationJobs, aiReferencePhotos } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { checkCreditsFromUser, deductCredits, refundCredits } from '@/lib/ai/credits';
import { detectFace } from '@/lib/ai/face-detection';
import { uploadToS3, copyToS3 } from '@/lib/ai/s3';
import { generateWeddingPhotosStream, modelSupportsReferenceImage, type AIStyle } from '@/lib/ai/generate';
import { findModelById } from '@/lib/ai/models';
import { rateLimit } from '@/lib/ai/rate-limit';
import { isValidImageBuffer } from '@/lib/ai/validation';
import { z } from 'zod';
import { AI_CONFIG } from '@/lib/ai/constants';
import { logger } from '@/lib/ai/logger';

const AIStyleSchema = z.enum([
  'CLASSIC_STUDIO',
  'OUTDOOR_GARDEN',
  'SUNSET_BEACH',
  'TRADITIONAL_HANBOK',
  'VINTAGE_CINEMATIC',
  'LUXURY_HOTEL',
  'CITY_LIFESTYLE',
  'ENCHANTED_FOREST',
  'BLACK_AND_WHITE',
  'MINIMALIST_GALLERY',
]);

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
    try {
      const message = `data: ${JSON.stringify({ type, ...data })}\n\n`;
      await writer.write(encoder.encode(message));
    } catch {
      // 클라이언트 연결 끊김 — 무시
    }
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
      const image = formData.get('image') as File | null;
      const styleRaw = formData.get('style') as string;
      const role = formData.get('role') as string;
      const modelId = formData.get('modelId') as string | null;
      const albumId = formData.get('albumId') as string | null;
      const jobId = formData.get('jobId') as string | null;
      const referencePhotoId = formData.get('referencePhotoId') as string | null;

      if (!styleRaw || !role) {
        await sendEvent('error', { error: 'Style and role are required' });
        await writer.close();
        return;
      }

      if (!image && !referencePhotoId) {
        await sendEvent('error', { error: 'Image or referencePhotoId is required' });
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

      // 4.5 참조 사진 조회 (referencePhotoId가 있을 때)
      let originalUrl: string | undefined;

      if (referencePhotoId) {
        const refPhoto = await db.query.aiReferencePhotos.findFirst({
          where: eq(aiReferencePhotos.id, referencePhotoId),
        });

        if (!refPhoto || refPhoto.userId !== user.id) {
          await sendEvent('error', { error: 'Reference photo not found' });
          await writer.close();
          return;
        }

        originalUrl = refPhoto.originalUrl;
      }

      // generationId 미리 생성 (감사 추적 referenceId용)
      const generationId = createId();

      // 5. 파일 검증 (referencePhotoId가 없을 때만)
      if (!referencePhotoId) {
        const uploadedImage = image!;

        if (!AI_CONFIG.ALLOWED_MIME_TYPES.includes(uploadedImage.type as any)) {
          await sendEvent('error', { error: 'JPG, PNG 파일만 업로드 가능합니다' });
          await writer.close();
          return;
        }

        if (uploadedImage.size > AI_CONFIG.MAX_FILE_SIZE) {
          await sendEvent('error', { error: 'File too large (max 10MB)' });
          await writer.close();
          return;
        }

        const arrayBuffer = await uploadedImage.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (!isValidImageBuffer(buffer)) {
          await sendEvent('error', { error: '유효하지 않은 이미지 파일입니다' });
          await writer.close();
          return;
        }

        // 7. 얼굴 감지 (참조 이미지 지원 모델만)
        if (modelSupportsReferenceImage(modelId || undefined)) {
          await sendEvent('status', { message: '얼굴 분석 중...' });
          const faceResult = await detectFace(buffer);
          if (!faceResult.success) {
            await sendEvent('error', { error: faceResult.error });
            await writer.close();
            return;
          }
        }

        // 9. S3 업로드
        await sendEvent('status', { message: '이미지 준비 중...' });
        try {
          const s3UploadResult = await uploadToS3(buffer, uploadedImage.type, `ai-originals/${user.id}`);
          originalUrl = s3UploadResult.url;
        } catch (error) {
          if (creditsDeducted) {
            await refundCredits(user.id, 1, {
              referenceType: 'GENERATION',
              referenceId: generationId,
              description: 'S3 업로드 실패 환불',
            });
          }
          await sendEvent('error', { error: 'S3 업로드 실패' });
          await writer.close();
          return;
        }
      }

      // 6. 크레딧 확인 & 차감 (jobId가 없을 때만 — Job은 이미 예약됨)
      let deductedBalance: number | undefined;
      if (!jobId) {
        const { hasCredits, balance } = checkCreditsFromUser(user);
        if (!hasCredits) {
          await sendEvent('error', { error: 'Insufficient credits', balance });
          await writer.close();
          return;
        }

        // 8. 크레딧 차감 (감사 추적 포함)
        deductedBalance = await deductCredits(user.id, 1, {
          referenceType: 'GENERATION',
          referenceId: generationId,
          description: 'AI 사진 생성 (스트리밍)',
        });
        creditsDeducted = true;
      }

      // 10. AI 생성 (스트리밍)
      await sendEvent('status', { message: 'AI 사진 생성 시작...', total: AI_CONFIG.BATCH_SIZE });

      const persistedUrls: string[] = [];
      const selectedModel = findModelById(modelId || 'flux-pro');
      const isReplicateProvider = selectedModel?.providerType === 'replicate';

      try {
        const result = await generateWeddingPhotosStream(
          originalUrl!,
          styleData,
          role as 'GROOM' | 'BRIDE',
          async (index, generatedUrl) => {
            let finalUrl = generatedUrl;

            // Replicate: CDN URL → S3 복사 필요
            // OpenAI/Gemini: generate.ts에서 이미 S3 업로드 완료
            if (isReplicateProvider) {
              try {
                const s3Result = await copyToS3(generatedUrl, `ai-generated/${user.id}`);
                finalUrl = s3Result.url;
              } catch {
                // S3 복사 실패 시 원본 URL 사용
              }
            }

            persistedUrls[index] = finalUrl;

            await sendEvent('image', {
              index,
              url: finalUrl,
              progress: index + 1,
              total: AI_CONFIG.BATCH_SIZE,
            });
          },
          modelId || undefined
        );

        // 11. DB 저장
        const [generation] = await db
          .insert(aiGenerations)
          .values({
            id: generationId,
            userId: user.id,
            originalUrl: originalUrl!,
            style: styleData,
            role: role as 'GROOM' | 'BRIDE',
            generatedUrls: persistedUrls,
            modelId: selectedModel?.id ?? modelId ?? null,
            albumId: albumId || null,
            jobId: jobId || null,
            status: 'COMPLETED',
            creditsUsed: 1,
            cost: result.cost,
            replicateId: isReplicateProvider ? result.providerJobId : null,
            providerJobId: result.providerJobId,
            providerType: selectedModel?.providerType ?? 'replicate',
            completedAt: new Date(),
          })
          .returning();

        // 11.5 Job 진행 상황 업데이트
        let jobProgress: { completed: number; total: number } | undefined;
        if (jobId) {
          await db.update(aiGenerationJobs).set({
            completedImages: sql`${aiGenerationJobs.completedImages} + 1`,
            creditsUsed: sql`${aiGenerationJobs.creditsUsed} + 1`,
            status: 'PROCESSING',
          }).where(eq(aiGenerationJobs.id, jobId));

          const updatedJob = await db.query.aiGenerationJobs.findFirst({
            where: eq(aiGenerationJobs.id, jobId),
            columns: { completedImages: true, totalImages: true },
          });
          if (updatedJob) {
            jobProgress = { completed: updatedJob.completedImages, total: updatedJob.totalImages };
          }
        }

        // 12. 완료
        let remainingCredits: number;
        if (deductedBalance !== undefined) {
          remainingCredits = deductedBalance;
        } else {
          remainingCredits = (
            await db.query.users.findFirst({
              where: eq(users.id, user.id),
              columns: { aiCredits: true },
            })
          )?.aiCredits ?? 0;
        }

        await sendEvent('done', {
          id: generation.id,
          originalUrl,
          generatedUrls: persistedUrls,
          style: styleData,
          albumId: albumId || null,
          remainingCredits,
          ...(jobProgress && { jobProgress }),
        });

      } catch (error) {
        // AI 생성 실패 시 환불 (jobId가 있으면 크레딧 차감을 안 했으므로 환불 불필요)
        if (!jobId) {
          await refundCredits(user.id, 1, {
            referenceType: 'GENERATION',
            referenceId: generationId,
            description: 'AI 생성 실패 환불 (스트리밍)',
          });
        }

        // Job 실패 카운트 업데이트
        if (jobId) {
          await db.update(aiGenerationJobs).set({
            failedImages: sql`${aiGenerationJobs.failedImages} + 1`,
          }).where(eq(aiGenerationJobs.id, jobId));
        }

        logger.error('AI generation failed', {
          userId,
          style,
          error: error instanceof Error ? error.message : String(error),
        });

        try {
          await db.insert(aiGenerations).values({
            id: generationId,
            userId: user.id,
            originalUrl: originalUrl!,
            style: styleData,
            role: role as 'GROOM' | 'BRIDE',
            modelId: selectedModel?.id ?? modelId ?? null,
            albumId: albumId || null,
            jobId: jobId || null,
            status: 'FAILED',
            creditsUsed: 0,
            cost: 0,
          });
        } catch (dbErr: any) {
          logger.error('Failed to save FAILED generation record', {
            error: dbErr?.message ?? String(dbErr),
            cause: dbErr?.cause?.message ?? dbErr?.cause ?? undefined,
            code: dbErr?.code ?? undefined,
            detail: dbErr?.detail ?? undefined,
          });
        }

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
      try {
        await writer.close();
      } catch {
        // 이미 닫힌 상태 — 무시
      }
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
