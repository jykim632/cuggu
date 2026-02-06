CREATE TABLE "ai_model_settings" (
	"model_id" varchar(64) PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"is_recommended" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_settings" (
	"key" varchar(128) PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"category" varchar(64) NOT NULL,
	"label" varchar(255) NOT NULL,
	"description" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "app_settings_category_idx" ON "app_settings" USING btree ("category");
