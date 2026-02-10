-- 테마 생성 멀티 모델 지원: model_id 컬럼 추가
ALTER TABLE "ai_themes" ADD COLUMN "model_id" varchar(64);

-- 기존 레코드는 모두 Claude Sonnet으로 생성됨
UPDATE "ai_themes" SET "model_id" = 'theme-claude-sonnet' WHERE "model_id" IS NULL;
