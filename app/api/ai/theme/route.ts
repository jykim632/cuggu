import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users, aiThemes, aiModelSettings } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { checkCreditsFromUser, deductCredits, refundCredits } from '@/lib/ai/credits';
import { generateTheme } from '@/lib/ai/theme-generation';
import { checkThemeClasses } from '@/lib/templates/safelist';
import { rateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

// ── POST: 테마 생성 ──

const CreateRequestSchema = z.object({
  prompt: z.string().min(2, '프롬프트는 2자 이상 입력해주세요').max(200, '프롬프트는 200자 이내로 입력해주세요'),
  invitationId: z.string().optional(),
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

    // 3. 테마 기능 활성화 확인
    const themeSetting = await db.query.aiModelSettings.findFirst({
      where: eq(aiModelSettings.modelId, 'theme-claude-sonnet'),
    });
    if (themeSetting?.enabled === false) {
      return NextResponse.json(
        { error: '테마 생성 기능이 비활성화되어 있습니다' },
        { status: 403 }
      );
    }

    // 4. Rate limiting (10회/시간)
    const rateLimitResult = await rateLimit(`ratelimit:ai-theme:${user.id}`, 10, 3600);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: '테마 생성 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 429 }
      );
    }

    // 5. 요청 파싱
    const body = await request.json();
    const parsed = CreateRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || '잘못된 요청입니다' },
        { status: 400 }
      );
    }

    // 6. 크레딧 확인
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

    // 7. 크레딧 차감
    await deductCredits(user.id, 1);

    // 8. AI 테마 생성
    let result;
    try {
      result = await generateTheme(parsed.data.prompt);
    } catch (error) {
      // Zod 파싱 실패(구조적 결함) — 크레딧 환불, 저장 안 함
      await refundCredits(user.id, 1);
      throw error;
    }

    // 9. DB 저장 (safelist 검증 전)
    const cost = (result.usage.inputTokens * 3 + result.usage.outputTokens * 15) / 1_000_000;

    const safelistResult = checkThemeClasses(result.theme as unknown as Record<string, unknown>);
    const themeStatus = safelistResult.valid ? 'completed' as const : 'safelist_failed' as const;

    const [inserted] = await db.insert(aiThemes).values({
      userId: user.id,
      invitationId: parsed.data.invitationId || null,
      prompt: parsed.data.prompt,
      theme: result.theme,
      status: themeStatus,
      failReason: safelistResult.valid ? null : safelistResult.violations.slice(0, 20).join('\n'),
      creditsUsed: 1,
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      cost,
    }).returning({ id: aiThemes.id });

    // 10. 잔여 크레딧
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
      themeId: inserted.id,
      theme: result.theme,
      status: themeStatus,
      failReason: safelistResult.valid ? undefined : '일부 스타일이 safelist에 포함되지 않아 적용 시 누락될 수 있습니다',
      remainingCredits,
    });

  } catch (error) {
    console.error('[AI Theme] Generation failed:', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'AI 테마 생성 중 오류가 발생했습니다. 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}

// ── GET: 테마 목록 ──

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, session.user.email),
    columns: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const invitationId = request.nextUrl.searchParams.get('invitationId');

  const themes = await db
    .select({
      id: aiThemes.id,
      prompt: aiThemes.prompt,
      theme: aiThemes.theme,
      status: aiThemes.status,
      failReason: aiThemes.failReason,
      createdAt: aiThemes.createdAt,
    })
    .from(aiThemes)
    .where(
      invitationId
        ? and(eq(aiThemes.userId, user.id), eq(aiThemes.invitationId, invitationId))
        : eq(aiThemes.userId, user.id)
    )
    .orderBy(desc(aiThemes.createdAt))
    .limit(20);

  // safelist_failed 테마를 현재 safelist로 재검증 → 통과하면 status 업데이트
  const healed: string[] = [];
  for (const theme of themes) {
    if (theme.status === 'safelist_failed' && theme.theme) {
      const result = checkThemeClasses(theme.theme as Record<string, unknown>);
      if (result.valid) {
        healed.push(theme.id);
        theme.status = 'completed';
        theme.failReason = null;
      }
    }
  }
  if (healed.length > 0) {
    // 비동기로 DB 업데이트 (응답 지연 없이)
    db.update(aiThemes)
      .set({ status: 'completed', failReason: null })
      .where(and(eq(aiThemes.userId, user.id), eq(aiThemes.status, 'safelist_failed')))
      .then(() => {})
      .catch(() => {});
  }

  return NextResponse.json({ themes });
}

// ── DELETE: 테마 삭제 ──

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, session.user.email),
    columns: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: '테마 ID가 필요합니다' }, { status: 400 });
  }

  const result = await db
    .delete(aiThemes)
    .where(and(eq(aiThemes.id, id), eq(aiThemes.userId, user.id)))
    .returning({ id: aiThemes.id });

  if (result.length === 0) {
    return NextResponse.json({ error: '테마를 찾을 수 없습니다' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
