import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users, aiGenerationJobs, aiGenerations } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { releaseCredits } from '@/lib/ai/credits';
import { logger } from '@/lib/ai/logger';
import { z } from 'zod';

type Params = { params: Promise<{ id: string }> };

const PatchJobSchema = z.object({
  action: z.literal('complete'),
});

/**
 * GET /api/ai/jobs/[id] — Job 상태 + 생성 결과 조회
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

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

    // 2. Job 조회 + 소유권 확인
    const job = await db.query.aiGenerationJobs.findFirst({
      where: and(
        eq(aiGenerationJobs.id, id),
        eq(aiGenerationJobs.userId, user.id)
      ),
    });

    if (!job) {
      return NextResponse.json(
        { error: '작업을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 3. 연결된 generations 조회
    const generations = await db
      .select({
        id: aiGenerations.id,
        originalUrl: aiGenerations.originalUrl,
        style: aiGenerations.style,
        role: aiGenerations.role,
        generatedUrls: aiGenerations.generatedUrls,
        selectedUrl: aiGenerations.selectedUrl,
        isFavorited: aiGenerations.isFavorited,
        modelId: aiGenerations.modelId,
        status: aiGenerations.status,
        createdAt: aiGenerations.createdAt,
        completedAt: aiGenerations.completedAt,
      })
      .from(aiGenerations)
      .where(eq(aiGenerations.jobId, id))
      .orderBy(desc(aiGenerations.createdAt));

    return NextResponse.json({
      success: true,
      data: {
        ...job,
        generations,
      },
    });
  } catch (error) {
    logger.error('Get job error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/ai/jobs/[id] — Job 완료 처리 (미사용 크레딧 환불)
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

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

    // 2. 요청 바디 검증
    const body = await request.json();
    const parsed = PatchJobSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || '잘못된 요청' },
        { status: 400 }
      );
    }

    // 3. Job 조회 + 소유권 확인
    const job = await db.query.aiGenerationJobs.findFirst({
      where: and(
        eq(aiGenerationJobs.id, id),
        eq(aiGenerationJobs.userId, user.id)
      ),
    });

    if (!job) {
      return NextResponse.json(
        { error: '작업을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 4. 상태 확인 — PENDING 또는 PROCESSING만 완료 처리 가능
    if (job.status !== 'PENDING' && job.status !== 'PROCESSING') {
      return NextResponse.json(
        { error: '이미 완료된 작업입니다' },
        { status: 400 }
      );
    }

    // 5. 최종 상태 결정
    let finalStatus: 'COMPLETED' | 'FAILED' | 'PARTIAL';
    if (job.failedImages === 0) {
      finalStatus = 'COMPLETED';
    } else if (job.completedImages === 0) {
      finalStatus = 'FAILED';
    } else {
      finalStatus = 'PARTIAL';
    }

    // 6. 미사용 크레딧 환불
    const unusedCredits = job.creditsReserved - job.creditsUsed;
    if (unusedCredits > 0) {
      await releaseCredits(user.id, unusedCredits, job.id);
    }

    // 7. Job 상태 업데이트
    const [updated] = await db
      .update(aiGenerationJobs)
      .set({
        status: finalStatus,
        completedAt: new Date(),
      })
      .where(eq(aiGenerationJobs.id, id))
      .returning();

    logger.info('Job completed', {
      userId: user.id,
      jobId: id,
      status: finalStatus,
      completedImages: job.completedImages,
      failedImages: job.failedImages,
      unusedCredits,
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    logger.error('Complete job error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
