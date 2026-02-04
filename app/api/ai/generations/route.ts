import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users, aiGenerations } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
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

    // 최근 20개 생성 이력
    const generations = await db.query.aiGenerations.findMany({
      where: eq(aiGenerations.userId, user.id),
      orderBy: [desc(aiGenerations.createdAt)],
      limit: 20,
    });

    return NextResponse.json({
      success: true,
      data: generations,
      remainingCredits: user.aiCredits,
    });
  } catch (error) {
    console.error('Get generations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
