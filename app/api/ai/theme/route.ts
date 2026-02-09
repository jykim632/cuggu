import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { checkCreditsFromUser, deductCredits, refundCredits } from '@/lib/ai/credits';
import { generateTheme } from '@/lib/ai/theme-generation';
import { rateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

const RequestSchema = z.object({
  prompt: z.string().min(2, '프롬프트는 2자 이상 입력해주세요').max(200, '프롬프트는 200자 이내로 입력해주세요'),
});

export async function POST(request: NextRequest) {
  let userId: string | undefined;

  try {
    // 1. 인증
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    // 2. 사용자 조회
    const user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    userId = user.id;

    // 3. Rate limiting (10회/시간)
    const rateLimitResult = await rateLimit(`ratelimit:ai-theme:${user.id}`, 10, 3600);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: '테마 생성 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 429 }
      );
    }

    // 4. 요청 파싱
    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || '잘못된 요청입니다' },
        { status: 400 }
      );
    }

    // 5. 크레딧 확인
    const isDev = process.env.NODE_ENV === 'development';
    if (!isDev) {
      const { hasCredits, balance } = checkCreditsFromUser(user);
      if (!hasCredits) {
        return NextResponse.json(
          { error: '크레딧이 부족합니다', balance },
          { status: 402 }
        );
      }
    }

    // 6. 크레딧 차감
    await deductCredits(user.id, 1);

    // 7. AI 테마 생성
    let theme;
    try {
      theme = await generateTheme(parsed.data.prompt);
    } catch (error) {
      // 생성 실패 시 크레딧 환불
      await refundCredits(user.id, 1);
      throw error;
    }

    // 8. 잔여 크레딧
    let remainingCredits = 999;
    if (!isDev) {
      const updatedUser = await db.query.users.findFirst({
        where: eq(users.id, user.id),
        columns: { aiCredits: true },
      });
      remainingCredits = updatedUser?.aiCredits ?? 0;
    }

    return NextResponse.json({
      success: true,
      theme,
      remainingCredits,
    });

  } catch (error) {
    console.error('[AI Theme] Generation failed:', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });

    // Zod/safelist 검증 실패는 사용자에게 명확한 메시지
    if (error instanceof Error && error.message.includes('disallowed Tailwind')) {
      return NextResponse.json(
        { error: 'AI가 생성한 테마에 허용되지 않은 스타일이 포함되어 있습니다. 다시 시도해주세요.' },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { error: 'AI 테마 생성 중 오류가 발생했습니다. 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}
