import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users, aiGenerationJobs, aiReferencePhotos } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { reserveCredits } from '@/lib/ai/credits';
import { CreateJobSchema } from '@/schemas/ai';
import { logger } from '@/lib/ai/logger';

/**
 * POST /api/ai/jobs — 생성 작업(Job) 생성 + 크레딧 선예약
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

    // 2. 요청 바디 검증
    const body = await request.json();
    const parsed = CreateJobSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || '잘못된 요청' },
        { status: 400 }
      );
    }

    const { albumId, mode, styles, roles, modelId, totalImages, referencePhotoIds } = parsed.data;

    // 3. 참조 사진 존재 + 활성 + 소유권 확인
    const refPhotos = await db
      .select({
        id: aiReferencePhotos.id,
        role: aiReferencePhotos.role,
      })
      .from(aiReferencePhotos)
      .where(
        and(
          inArray(aiReferencePhotos.id, referencePhotoIds),
          eq(aiReferencePhotos.userId, user.id),
          eq(aiReferencePhotos.isActive, true)
        )
      );

    if (refPhotos.length !== referencePhotoIds.length) {
      return NextResponse.json(
        { error: '유효하지 않은 참조 사진이 포함되어 있습니다' },
        { status: 400 }
      );
    }

    // role별 참조 사진 매핑
    const refPhotoByRole = new Map(refPhotos.map((p) => [p.role, p.id]));

    // 요청된 roles에 대응하는 참조 사진이 있는지 확인
    for (const role of roles) {
      if (!refPhotoByRole.has(role)) {
        return NextResponse.json(
          { error: `${role} 역할에 해당하는 참조 사진이 없습니다` },
          { status: 400 }
        );
      }
    }

    // 4. 크레딧 계산
    const creditsNeeded = totalImages * 1;

    // 5. Job ID 생성 + 크레딧 선예약
    const jobId = createId();

    try {
      await reserveCredits(user.id, creditsNeeded, jobId);
    } catch (error) {
      if (error instanceof Error && error.message === 'Insufficient credits') {
        return NextResponse.json(
          { error: '크레딧이 부족합니다' },
          { status: 402 }
        );
      }
      throw error;
    }

    // 커플 모드 여부: 역할 2개 = 커플
    const isCouple = roles.length > 1;
    const allRefPhotoIds = referencePhotoIds;

    // 6. Job 레코드 삽입
    const [job] = await db
      .insert(aiGenerationJobs)
      .values({
        id: jobId,
        userId: user.id,
        albumId,
        mode,
        config: {
          styles,
          roles,
          modelId,
          groomRefId: refPhotoByRole.get('GROOM'),
          brideRefId: refPhotoByRole.get('BRIDE'),
        },
        totalImages,
        creditsReserved: creditsNeeded,
      })
      .returning();

    // 7. 태스크 목록 생성 (client-side orchestration용, DB 저장 안 함)
    const tasks: { index: number; style: string; role: string; referencePhotoIds: string[] }[] = [];

    for (let i = 0; i < totalImages; i++) {
      tasks.push({
        index: i,
        style: styles[i % styles.length],
        role: isCouple ? 'COUPLE' : roles[0],
        referencePhotoIds: allRefPhotoIds,
      });
    }

    // invariant: tasks.length === totalImages
    if (tasks.length !== totalImages) {
      logger.error('Task count mismatch', { tasksLength: tasks.length, totalImages, mode });
      return NextResponse.json(
        { error: 'Internal error: task count mismatch' },
        { status: 500 }
      );
    }

    logger.info('Job created', {
      userId: user.id,
      jobId: job.id,
      mode,
      totalImages,
      creditsReserved: creditsNeeded,
    });

    // 8. 응답
    return NextResponse.json(
      {
        success: true,
        data: {
          jobId: job.id,
          creditsReserved: creditsNeeded,
          tasks,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Create job error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
