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
import { AI_THEME_MODELS, DEFAULT_THEME_CONFIG, findThemeModelById } from "@/lib/ai/theme-models";
import type { ThemeGenerationConfig } from "@/lib/ai/theme-models";
import { getAppSetting, setAppSetting } from "@/lib/settings";
import { z } from "zod";

const THEME_CONFIG_KEY = "theme_generation_config";

const PatchModelSchema = z.object({
  type: z.literal("model").optional(),
  modelId: z.string().min(1).max(64),
  enabled: z.boolean().optional(),
  isRecommended: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const PatchThemeConfigSchema = z.object({
  type: z.literal("theme_config"),
  fastModelId: z.string().min(1).max(64),
  qualityModelId: z.string().min(1).max(64),
});

/**
 * GET /api/admin/ai-models
 * 사진 모델 + 테마 모델 + 테마 설정 반환
 */
export const GET = withErrorHandler(async () => {
  await requireAdmin();

  const dbSettings = await db.select().from(aiModelSettings);
  const settingsMap = new Map(dbSettings.map((s) => [s.modelId, s]));

  // 사진 모델
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

  // 테마 모델 정보 (읽기 전용 — 모델 목록)
  const themeModels = Object.values(AI_THEME_MODELS).map((model) => ({
    ...model,
  }));

  // 테마 설정 (어떤 모델이 빠른/정밀에 배정됐는지)
  const themeConfig = await getAppSetting<ThemeGenerationConfig>(
    THEME_CONFIG_KEY,
    DEFAULT_THEME_CONFIG,
  );

  return successResponse({ models, themeModels, themeConfig });
});

/**
 * PATCH /api/admin/ai-models
 * 사진 모델 설정 upsert 또는 테마 설정 저장
 */
export const PATCH = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();

  const body = await req.json();

  // 테마 설정 저장
  if (body.type === "theme_config") {
    const data = PatchThemeConfigSchema.parse(body);

    // 모델 존재 여부 확인
    if (!findThemeModelById(data.fastModelId)) {
      throw new ValidationError(`존재하지 않는 테마 모델입니다: ${data.fastModelId}`);
    }
    if (!findThemeModelById(data.qualityModelId)) {
      throw new ValidationError(`존재하지 않는 테마 모델입니다: ${data.qualityModelId}`);
    }

    const config: ThemeGenerationConfig = {
      fastModelId: data.fastModelId,
      qualityModelId: data.qualityModelId,
    };

    await setAppSetting(THEME_CONFIG_KEY, config, {
      category: "ai",
      label: "테마 생성 모드 설정",
      description: "빠른 생성 / 정밀 생성에 사용할 AI 모델 설정",
    });

    return successResponse({ themeConfig: config });
  }

  // 사진 모델 설정 upsert
  const data = PatchModelSchema.parse(body);

  const isPhotoModel = Object.values(AI_MODELS).some((m) => m.id === data.modelId);
  if (!isPhotoModel) {
    throw new ValidationError(`존재하지 않는 모델입니다: ${data.modelId}`);
  }

  // 비활성화 시 최소 1개 활성 모델 보장
  if (data.enabled === false) {
    const dbSettings = await db.select().from(aiModelSettings);
    const settingsMap = new Map(dbSettings.map((s) => [s.modelId, s]));

    const enabledCount = Object.values(AI_MODELS).filter((m) => {
      if (m.id === data.modelId) return false;
      const s = settingsMap.get(m.id);
      return s?.enabled ?? true;
    }).length;

    if (enabledCount === 0) {
      throw new ValidationError("최소 1개의 사진 모델은 활성화되어야 합니다");
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

  const updated = await db
    .select()
    .from(aiModelSettings)
    .where(eq(aiModelSettings.modelId, data.modelId));

  return successResponse({ setting: updated[0] });
});
