ALTER TYPE "ai_theme_status" ADD VALUE IF NOT EXISTS 'failed';

-- theme 컬럼을 nullable로 변경 (실패 시 theme 데이터 없음)
ALTER TABLE "ai_themes" ALTER COLUMN "theme" DROP NOT NULL;
