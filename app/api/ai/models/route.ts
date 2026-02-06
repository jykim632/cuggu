import { db } from "@/db";
import { aiModelSettings } from "@/db/schema";
import { auth } from "@/auth";
import { withErrorHandler, successResponse, UnauthorizedError } from "@/lib/api-utils";
import { AI_MODELS, DEFAULT_MODEL } from "@/lib/ai/models";

/**
 * GET /api/ai/models
 * 활성화된 모델 목록 반환 (인증 유저용)
 */
export const GET = withErrorHandler(async () => {
  const session = await auth();
  if (!session?.user?.email) {
    throw new UnauthorizedError("로그인이 필요합니다");
  }

  const dbSettings = await db.select().from(aiModelSettings);
  const settingsMap = new Map(dbSettings.map((s) => [s.modelId, s]));

  const models = Object.values(AI_MODELS)
    .map((model, index) => {
      const settings = settingsMap.get(model.id);
      return {
        id: model.id,
        name: model.name,
        provider: model.provider,
        costPerImage: model.costPerImage,
        description: model.description,
        facePreservation: model.facePreservation,
        speed: model.speed,
        enabled: settings?.enabled ?? true,
        isRecommended: settings?.isRecommended ?? false,
        sortOrder: settings?.sortOrder ?? index,
      };
    })
    .filter((m) => m.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return successResponse({
    models,
    defaultModel: models.some((m) => m.id === DEFAULT_MODEL)
      ? DEFAULT_MODEL
      : models[0]?.id ?? null,
  });
});
