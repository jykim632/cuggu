import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users, aiThemes, invitations } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { checkCreditsFromUser, deductCredits, refundCredits } from '@/lib/ai/credits';
import { generateTheme } from '@/lib/ai/theme-generation';
import { DEFAULT_THEME_CONFIG, findThemeModelById } from '@/lib/ai/theme-models';
import type { AIThemeModel, ThemeMode, ThemeGenerationConfig } from '@/lib/ai/theme-models';
import { extractThemeContext, buildContextPrompt } from '@/lib/ai/theme-context';
import { checkThemeClasses } from '@/lib/templates/safelist';
import { getAppSetting } from '@/lib/settings';
import { rateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

// ── 모델 해석 ──

async function resolveThemeModel(mode: ThemeMode = 'fast'): Promise<AIThemeModel> {
  const config = await getAppSetting<ThemeGenerationConfig>(
    'theme_generation_config',
    DEFAULT_THEME_CONFIG,
  );

  const modelId = mode === 'quality' ? config.qualityModelId : config.fastModelId;
  const model = findThemeModelById(modelId);

  if (!model) {
    // fallback: 설정이 잘못됐으면 기본값 사용
    const fallbackId = mode === 'quality'
      ? DEFAULT_THEME_CONFIG.qualityModelId
      : DEFAULT_THEME_CONFIG.fastModelId;
    const fallback = findThemeModelById(fallbackId);
    if (!fallback) {
      throw { status: 500, message: '테마 모델 설정 오류' };
    }
    return fallback;
  }

  return model;
}

// ── POST: 테마 생성 ──

const CreateRequestSchema = z.object({
  prompt: z.string().min(2, '프롬프트는 2자 이상 입력해주세요').max(250, '프롬프트는 250자 이내로 입력해주세요'),
  invitationId: z.string().optional(),
  mode: z.enum(['fast', 'quality']).optional(),
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

    // 3. 요청 파싱
    const body = await request.json();
    const parsed = CreateRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || '잘못된 요청입니다' },
        { status: 400 }
      );
    }

    // 4. 모델 해석 (mode 기반)
    let themeModel: AIThemeModel;
    try {
      themeModel = await resolveThemeModel(parsed.data.mode);
    } catch (err: any) {
      if (err.status && err.message) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      throw err;
    }

    // 5. Rate limiting (10회/시간)
    const rateLimitResult = await rateLimit(`ratelimit:ai-theme:${user.id}`, 10, 3600);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: '테마 생성 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 429 }
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

    // 7.5. 청첩장 컨텍스트 추출 (invitationId가 있을 때만)
    let enhancedPrompt = parsed.data.prompt;
    if (parsed.data.invitationId) {
      try {
        const inv = await db.query.invitations.findFirst({
          where: and(
            eq(invitations.id, parsed.data.invitationId),
            eq(invitations.userId, user.id),
          ),
          columns: {
            weddingDate: true,
            venueName: true,
            introMessage: true,
            galleryImages: true,
          },
        });

        if (inv) {
          const ctx = extractThemeContext({
            weddingDate: inv.weddingDate,
            venueName: inv.venueName,
            introMessage: inv.introMessage,
            galleryImages: inv.galleryImages,
          });
          const contextSuffix = buildContextPrompt(ctx);
          if (contextSuffix) {
            enhancedPrompt = parsed.data.prompt + contextSuffix;
          }
        }
      } catch {
        // 컨텍스트 추출 실패 시 원본 프롬프트로 폴백
      }
    }

    // 8. AI 테마 생성
    let result;
    try {
      result = await generateTheme(enhancedPrompt, themeModel);
    } catch (error) {
      // 생성 실패 — 크레딧 환불 + DB에 실패 기록 (API 비용은 이미 발생)
      await refundCredits(user.id, 1);

      const failMessage = error instanceof Error ? error.message : String(error);
      await db.insert(aiThemes).values({
        userId: user.id,
        invitationId: parsed.data.invitationId || null,
        prompt: parsed.data.prompt,
        modelId: themeModel.id,
        theme: null,
        status: 'failed',
        failReason: failMessage.slice(0, 2000),
        creditsUsed: 0,
      }).catch(() => {}); // DB 기록 실패해도 원래 에러 유지

      throw error;
    }

    // 9. DB 저장
    const safelistResult = checkThemeClasses(result.theme as unknown as Record<string, unknown>);
    const themeStatus = safelistResult.valid ? 'completed' as const : 'safelist_failed' as const;

    const [inserted] = await db.insert(aiThemes).values({
      userId: user.id,
      invitationId: parsed.data.invitationId || null,
      prompt: parsed.data.prompt,
      modelId: result.modelId,
      theme: result.theme,
      status: themeStatus,
      failReason: safelistResult.valid ? null : safelistResult.violations.slice(0, 20).join('\n'),
      creditsUsed: 1,
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      cost: result.cost,
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
      modelId: result.modelId,
      mode: parsed.data.mode || 'fast',
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
      modelId: aiThemes.modelId,
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
