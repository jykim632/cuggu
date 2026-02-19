import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users, aiGenerations, aiGenerationJobs, aiReferencePhotos, aiAlbums } from '@/db/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { checkCreditsFromUser, deductCredits, refundCredits, releaseCredits } from '@/lib/ai/credits';
import { detectFace } from '@/lib/ai/face-detection';
import { uploadToS3 } from '@/lib/ai/s3';
import { generateWeddingPhotosStream, modelSupportsReferenceImage, type AIStyle } from '@/lib/ai/generate';
import { findModelById } from '@/lib/ai/models';
import { rateLimit } from '@/lib/ai/rate-limit';
import { isValidImageBuffer } from '@/lib/ai/validation';
import { AI_CONFIG } from '@/lib/ai/constants';
import { logger } from '@/lib/ai/logger';
import { AIStyleSchema } from '@/schemas/ai';

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
      const referencePhotoIds = formData.getAll('referencePhotoIds') as string[];

      if (!styleRaw || !role) {
        await sendEvent('error', { error: 'Style and role are required' });
        await writer.close();
        return;
      }

      if (!image && referencePhotoIds.length === 0) {
        await sendEvent('error', { error: 'Image or referencePhotoIds is required' });
        await writer.close();
        return;
      }

      if (role !== 'GROOM' && role !== 'BRIDE' && role !== 'COUPLE') {
        await sendEvent('error', { error: 'Role must be GROOM, BRIDE, or COUPLE' });
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

      // 4.5 albumId 소유권 검증
      let validatedAlbumId = albumId;
      if (albumId) {
        const album = await db.query.aiAlbums.findFirst({
          where: and(eq(aiAlbums.id, albumId), eq(aiAlbums.userId, user.id)),
          columns: { id: true },
        });
        if (!album) {
          logger.warn('Invalid albumId — falling back to null', { userId: user.id, albumId });
          validatedAlbumId = null;
        }
      }

      // 4.6 참조 사진 조회 (referencePhotoIds가 있을 때)
      let imageUrls: string[] = [];

      if (referencePhotoIds.length > 0) {
        const refPhotos = await db
          .select({ id: aiReferencePhotos.id, originalUrl: aiReferencePhotos.originalUrl, userId: aiReferencePhotos.userId })
          .from(aiReferencePhotos)
          .where(inArray(aiReferencePhotos.id, referencePhotoIds));

        // 소유권 확인
        const invalidPhotos = refPhotos.filter(p => p.userId !== user.id);
        if (invalidPhotos.length > 0 || refPhotos.length !== referencePhotoIds.length) {
          await sendEvent('error', { error: 'Reference photo not found' });
          await writer.close();
          return;
        }

        imageUrls = refPhotos.map(p => p.originalUrl);
      }

      // generationId 미리 생성 (감사 추적 referenceId용)
      const generationId = createId();

      // 5. 파일 검증 (referencePhotoIds가 없을 때만)
      if (referencePhotoIds.length === 0) {
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
          imageUrls = [s3UploadResult.url];
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
      const selectedModel = modelId ? findModelById(modelId) : undefined;

      try {
        const result = await generateWeddingPhotosStream(
          imageUrls,
          styleData as AIStyle,
          role as 'GROOM' | 'BRIDE' | 'COUPLE',
          async (index, generatedUrl) => {
            persistedUrls[index] = generatedUrl;

            await sendEvent('image', {
              index,
              url: generatedUrl,
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
            originalUrl: imageUrls[0],
            style: styleData,
            role: role as 'GROOM' | 'BRIDE' | 'COUPLE',
            generatedUrls: persistedUrls,
            modelId: selectedModel?.id ?? modelId ?? null,
            albumId: validatedAlbumId || null,
            jobId: jobId || null,
            status: 'COMPLETED',
            creditsUsed: 1,
            cost: result.cost,
            providerJobId: result.providerJobId,
            providerType: selectedModel?.providerType ?? 'gemini',
            completedAt: new Date(),
          })
          .returning();

        // 11.5 Job 진행 상황 업데이트 + 자동 완료 체크
        let jobProgress: { completed: number; total: number } | undefined;
        if (jobId) {
          await db.update(aiGenerationJobs).set({
            completedImages: sql`${aiGenerationJobs.completedImages} + 1`,
            creditsUsed: sql`${aiGenerationJobs.creditsUsed} + 1`,
            status: 'PROCESSING',
          }).where(eq(aiGenerationJobs.id, jobId));

          const updatedJob = await db.query.aiGenerationJobs.findFirst({
            where: eq(aiGenerationJobs.id, jobId),
            columns: {
              completedImages: true, failedImages: true, totalImages: true,
              creditsReserved: true, creditsUsed: true, status: true, userId: true,
            },
          });
          if (updatedJob) {
            jobProgress = { completed: updatedJob.completedImages, total: updatedJob.totalImages };

            // 모든 이미지 처리 완료 → 서버 사이드 자동 완료
            if (updatedJob.status === 'PROCESSING' &&
                updatedJob.completedImages + updatedJob.failedImages >= updatedJob.totalImages) {
              const finalStatus = updatedJob.completedImages === 0 ? 'FAILED'
                                : updatedJob.failedImages === 0 ? 'COMPLETED' : 'PARTIAL';
              const unusedCredits = updatedJob.creditsReserved - updatedJob.creditsUsed;
              if (unusedCredits > 0 && updatedJob.userId) {
                await releaseCredits(updatedJob.userId, unusedCredits, jobId);
              }
              await db.update(aiGenerationJobs).set({
                status: finalStatus,
                completedAt: new Date(),
              }).where(and(eq(aiGenerationJobs.id, jobId), eq(aiGenerationJobs.status, 'PROCESSING')));
            }
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
          originalUrl: imageUrls[0],
          generatedUrls: persistedUrls,
          style: styleData,
          albumId: validatedAlbumId || null,
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

        // Job 실패 카운트 업데이트 + 자동 완료 체크
        if (jobId) {
          await db.update(aiGenerationJobs).set({
            failedImages: sql`${aiGenerationJobs.failedImages} + 1`,
          }).where(eq(aiGenerationJobs.id, jobId));

          const failedJob = await db.query.aiGenerationJobs.findFirst({
            where: eq(aiGenerationJobs.id, jobId),
            columns: {
              completedImages: true, failedImages: true, totalImages: true,
              creditsReserved: true, creditsUsed: true, status: true, userId: true,
            },
          });
          if (failedJob && failedJob.status === 'PROCESSING' &&
              failedJob.completedImages + failedJob.failedImages >= failedJob.totalImages) {
            const finalStatus = failedJob.completedImages === 0 ? 'FAILED'
                              : failedJob.failedImages === 0 ? 'COMPLETED' : 'PARTIAL';
            const unusedCredits = failedJob.creditsReserved - failedJob.creditsUsed;
            if (unusedCredits > 0 && failedJob.userId) {
              await releaseCredits(failedJob.userId, unusedCredits, jobId);
            }
            await db.update(aiGenerationJobs).set({
              status: finalStatus,
              completedAt: new Date(),
            }).where(and(eq(aiGenerationJobs.id, jobId), eq(aiGenerationJobs.status, 'PROCESSING')));
          }
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
            originalUrl: imageUrls[0] ?? '',
            style: styleData,
            role: role as 'GROOM' | 'BRIDE' | 'COUPLE',
            modelId: selectedModel?.id ?? modelId ?? null,
            albumId: validatedAlbumId || null,
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
