CREATE TYPE "public"."ai_credit_tx_type" AS ENUM('DEDUCT', 'REFUND', 'PURCHASE', 'BONUS');--> statement-breakpoint
CREATE TYPE "public"."ai_job_mode" AS ENUM('SINGLE', 'BATCH');--> statement-breakpoint
CREATE TYPE "public"."ai_job_status" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'PARTIAL', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "ai_credit_transactions" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"type" "ai_credit_tx_type" NOT NULL,
	"amount" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"reference_type" varchar(32),
	"reference_id" varchar(128),
	"description" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_generation_jobs" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"album_id" varchar(128),
	"mode" "ai_job_mode" NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb,
	"total_images" integer NOT NULL,
	"completed_images" integer DEFAULT 0 NOT NULL,
	"failed_images" integer DEFAULT 0 NOT NULL,
	"credits_reserved" integer NOT NULL,
	"credits_used" integer DEFAULT 0 NOT NULL,
	"status" "ai_job_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "ai_reference_photos" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"role" varchar(8) NOT NULL,
	"original_url" varchar(500) NOT NULL,
	"face_detected" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "ai_credits" SET DEFAULT 5;--> statement-breakpoint
ALTER TABLE "ai_albums" ADD COLUMN "groups" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "ai_generations" ADD COLUMN "job_id" varchar(128);--> statement-breakpoint
ALTER TABLE "ai_credit_transactions" ADD CONSTRAINT "ai_credit_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_generation_jobs" ADD CONSTRAINT "ai_generation_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_generation_jobs" ADD CONSTRAINT "ai_generation_jobs_album_id_ai_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."ai_albums"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_reference_photos" ADD CONSTRAINT "ai_reference_photos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_credit_tx_user_idx" ON "ai_credit_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_jobs_user_status_idx" ON "ai_generation_jobs" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "ai_ref_photos_user_role_idx" ON "ai_reference_photos" USING btree ("user_id","role");--> statement-breakpoint
ALTER TABLE "ai_generations" ADD CONSTRAINT "ai_generations_job_id_ai_generation_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."ai_generation_jobs"("id") ON DELETE set null ON UPDATE no action;