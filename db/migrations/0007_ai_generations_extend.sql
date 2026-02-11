-- Phase 0: aiGenerations 테이블 확장
-- role, isFavorited, modelId 컬럼 추가 (all nullable/default → 기존 데이터 영향 없음)

ALTER TABLE "ai_generations" ADD COLUMN "role" varchar(8);
ALTER TABLE "ai_generations" ADD COLUMN "is_favorited" boolean DEFAULT false NOT NULL;
ALTER TABLE "ai_generations" ADD COLUMN "model_id" varchar(64);
