import { NextRequest } from "next/server";
import { db } from "@/db";
import { aiModelSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin";
import {
  withErrorHandler,
  successResponse,
  ValidationError,
} from "@/lib/api-utils";
import { AI_MODELS } from "@/lib/ai/models";
import { z } from "zod";

const THEME_MODEL_ID = "theme-claude-sonnet";

const PatchSchema = z.object({
  modelId: z.string().min(1).max(64),
  enabled: z.boolean().optional(),
  isRecommended: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

/**
 * GET /api/admin/ai-models
 * AI_MODELS(코드) + aiModelSettings(DB) 조인
 */
export const GET = withErrorHandler(async () => {
  await requireAdmin();

  const dbSettings = await db.select().from(aiModelSettings);
  const settingsMap = new Map(dbSettings.map((s) => [s.modelId, s]));

  const models = Object.values(AI_MODELS).map((model, index) => {
    const settings = settingsMap.get(model.id);
    return {
      ...model,
      enabled: settings?.enabled ?? true,
      isRecommended: settings?.isRecommended ?? false,
      sortOrder: settings?.sortOrder ?? index,
      updatedAt: settings?.updatedAt?.toISOString() ?? null,
    };
  });

  models.sort((a, b) => a.sortOrder - b.sortOrder);

  // 테마 모델 설정
  const themeSetting = settingsMap.get(THEME_MODEL_ID);
  const themeModel = {
    modelId: THEME_MODEL_ID,
    enabled: themeSetting?.enabled ?? true,
    updatedAt: themeSetting?.updatedAt?.toISOString() ?? null,
  };

  return successResponse({ models, themeModel });
});

/**
 * PATCH /api/admin/ai-models
 * 모델 설정 upsert
 */
export const PATCH = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();

  const body = await req.json();
  const data = PatchSchema.parse(body);

  // 존재하는 모델인지 확인 (테마 모델도 허용)
  const isPhotoModel = Object.values(AI_MODELS).some((m) => m.id === data.modelId);
  const isThemeModel = data.modelId === THEME_MODEL_ID;
  if (!isPhotoModel && !isThemeModel) {
    throw new ValidationError(`존재하지 않는 모델입니다: ${data.modelId}`);
  }

  // 사진 모델 비활성화 시 최소 1개 활성 모델 보장 (테마 모델은 제외)
  if (data.enabled === false && isPhotoModel) {
    const dbSettings = await db.select().from(aiModelSettings);
    const settingsMap = new Map(dbSettings.map((s) => [s.modelId, s]));

    const enabledCount = Object.values(AI_MODELS).filter((m) => {
      if (m.id === data.modelId) return false; // 현재 비활성화 대상 제외
      const s = settingsMap.get(m.id);
      return s?.enabled ?? true; // DB에 없으면 기본값 true
    }).length;

    if (enabledCount === 0) {
      throw new ValidationError("최소 1개의 모델은 활성화되어야 합니다");
    }
  }

  // Upsert
  const updateFields: Record<string, unknown> = { updatedAt: new Date() };
  if (data.enabled !== undefined) updateFields.enabled = data.enabled;
  if (data.isRecommended !== undefined) updateFields.isRecommended = data.isRecommended;
  if (data.sortOrder !== undefined) updateFields.sortOrder = data.sortOrder;

  await db
    .insert(aiModelSettings)
    .values({
      modelId: data.modelId,
      enabled: data.enabled ?? true,
      isRecommended: data.isRecommended ?? false,
      sortOrder: data.sortOrder ?? 0,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: aiModelSettings.modelId,
      set: updateFields,
    });

  // 업데이트된 설정 반환
  const updated = await db
    .select()
    .from(aiModelSettings)
    .where(eq(aiModelSettings.modelId, data.modelId));

  return successResponse({ setting: updated[0] });
});
