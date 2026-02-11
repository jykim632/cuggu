import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users, aiGenerations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * PATCH /api/ai/generations/[id]
 * 즐겨찾기 토글
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const body = await request.json();
    const { isFavorited } = body;

    if (typeof isFavorited !== 'boolean') {
      return NextResponse.json({ error: 'isFavorited must be a boolean' }, { status: 400 });
    }

    const result = await db
      .update(aiGenerations)
      .set({ isFavorited })
      .where(
        and(
          eq(aiGenerations.id, id),
          eq(aiGenerations.userId, user.id)
        )
      )
      .returning({ id: aiGenerations.id, isFavorited: aiGenerations.isFavorited });

    if (result.length === 0) {
      return NextResponse.json({ error: '생성 기록을 찾을 수 없습니다' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Patch generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
