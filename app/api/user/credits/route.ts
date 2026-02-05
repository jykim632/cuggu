import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * 사용자의 AI 크레딧 조회
 *
 * @returns { success: true, credits: number }
 */
export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 개발 모드: 무제한 크레딧
  if (IS_DEV) {
    return NextResponse.json({
      success: true,
      credits: 999,
    });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, session.user.email),
    columns: { aiCredits: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    credits: user.aiCredits,
  });
}
