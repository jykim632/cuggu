import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users, aiReferencePhotos } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/lib/ai/logger';

type Params = { params: Promise<{ id: string }> };

/**
 * DELETE /api/ai/reference-photos/[id] — 참조 사진 비활성화 (soft delete)
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

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

    // 소유권 확인
    const photo = await db.query.aiReferencePhotos.findFirst({
      where: and(
        eq(aiReferencePhotos.id, id),
        eq(aiReferencePhotos.userId, user.id),
        eq(aiReferencePhotos.isActive, true)
      ),
    });

    if (!photo) {
      return NextResponse.json(
        { error: '참조 사진을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // soft delete
    await db
      .update(aiReferencePhotos)
      .set({ isActive: false })
      .where(eq(aiReferencePhotos.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Delete reference photo error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
