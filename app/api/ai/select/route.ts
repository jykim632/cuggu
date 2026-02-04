import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users, aiGenerations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { generationId, selectedUrl } = await request.json();

    if (!generationId || !selectedUrl) {
      return NextResponse.json(
        { error: 'generationId and selectedUrl are required' },
        { status: 400 }
      );
    }

    // 선택 저장
    const [updated] = await db
      .update(aiGenerations)
      .set({ selectedUrl })
      .where(
        and(
          eq(aiGenerations.id, generationId),
          eq(aiGenerations.userId, user.id)
        )
      )
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: 'Generation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { selectedUrl: updated.selectedUrl },
    });
  } catch (error) {
    console.error('Select photo error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
