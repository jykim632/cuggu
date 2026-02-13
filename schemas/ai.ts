import { z } from 'zod';

// ============================================================
// AI Generation Schemas
// ============================================================

// Enums
export const AIStyleSchema = z.enum([
  // Legacy (하위 호환)
  'CLASSIC',
  'MODERN',
  'VINTAGE',
  'ROMANTIC',
  'CINEMATIC',
  // New styles
  'CLASSIC_STUDIO',
  'OUTDOOR_GARDEN',
  'SUNSET_BEACH',
  'TRADITIONAL_HANBOK',
  'VINTAGE_CINEMATIC',
  'LUXURY_HOTEL',
  'CITY_LIFESTYLE',
  'ENCHANTED_FOREST',
  'BLACK_AND_WHITE',
  'MINIMALIST_GALLERY',
]);

export const AIGenerationStatusSchema = z.enum([
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
]);

export type AIStyle = z.infer<typeof AIStyleSchema>;
export type AIGenerationStatus = z.infer<typeof AIGenerationStatusSchema>;

// Base AI Generation Schema (DB 모델과 매칭)
export const AIGenerationSchema = z.object({
  id: z.cuid2(),
  userId: z.cuid2(),

  originalUrl: z.url().max(500),
  style: AIStyleSchema,
  generatedUrls: z.array(z.url()).nullable(), // 4 URLs
  selectedUrl: z.url().max(500).nullable(),
  status: AIGenerationStatusSchema.default('PENDING'),
  creditsUsed: z.number().int().min(1).default(1),
  cost: z.number().min(0), // USD
  replicateId: z.string().max(255).nullable(), // deprecated
  providerJobId: z.string().max(255).nullable(),
  providerType: z.enum(['replicate', 'openai', 'gemini']).nullable(),

  createdAt: z.date(),
  completedAt: z.date().nullable(),
});

export type AIGeneration = z.infer<typeof AIGenerationSchema>;

// ============================================================
// API Request/Response Schemas
// ============================================================

// AI 사진 생성 요청
export const GenerateAIPhotoRequestSchema = z.object({
  imageFile: z.instanceof(File).refine(
    (file) => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      return validTypes.includes(file.type);
    },
    { message: 'JPG, PNG, WebP 형식만 지원합니다' }
  ).refine(
    (file) => file.size <= 10 * 1024 * 1024, // 10MB
    { message: '파일 크기는 10MB 이하여야 합니다' }
  ),
  style: AIStyleSchema,
});

// 서버에서 받는 요청 (FormData)
export const GenerateAIPhotoServerRequestSchema = z.object({
  style: AIStyleSchema,
  imageUrl: z.url(), // 이미 업로드된 이미지 URL
});

export type GenerateAIPhotoRequest = z.infer<typeof GenerateAIPhotoRequestSchema>;
export type GenerateAIPhotoServerRequest = z.infer<typeof GenerateAIPhotoServerRequestSchema>;

// AI 사진 선택 요청
export const SelectAIPhotoRequestSchema = z.object({
  generationId: z.cuid2(),
  selectedUrl: z.url(),
});

export type SelectAIPhotoRequest = z.infer<typeof SelectAIPhotoRequestSchema>;

// AI 생성 응답
export const AIGenerationResponseSchema = AIGenerationSchema.omit({
  userId: true,
  cost: true,
  replicateId: true,
  providerJobId: true,
  providerType: true,
});

export type AIGenerationResponse = z.infer<typeof AIGenerationResponseSchema>;

// AI 생성 상태 응답
export const AIGenerationStatusResponseSchema = z.object({
  id: z.cuid2(),
  status: AIGenerationStatusSchema,
  generatedUrls: z.array(z.url()).nullable(),
  progress: z.number().min(0).max(100).optional(), // 진행률 (%)
  errorMessage: z.string().optional(),
});

export type AIGenerationStatusResponse = z.infer<typeof AIGenerationStatusResponseSchema>;

// AI 크레딧 정보 응답
export const AICreditsResponseSchema = z.object({
  userId: z.cuid2(),
  aiCredits: z.number().int().min(0),
  premiumPlan: z.enum(['FREE', 'PREMIUM']),
  totalGenerated: z.number().int().min(0),
  canGenerate: z.boolean(),
});

export type AICreditsResponse = z.infer<typeof AICreditsResponseSchema>;

// ============================================================
// Replicate API Schemas
// ============================================================

// Replicate API 요청
export const ReplicateAPIRequestSchema = z.object({
  version: z.string(),
  input: z.object({
    image: z.url(), // Base64 or URL
    prompt: z.string(),
    negative_prompt: z.string().optional(),
    num_outputs: z.number().int().min(1).max(4).default(4),
    guidance_scale: z.number().min(1).max(20).default(7.5),
    num_inference_steps: z.number().int().min(1).max(50).default(25),
  }),
});

export type ReplicateAPIRequest = z.infer<typeof ReplicateAPIRequestSchema>;

// Replicate API 응답
export const ReplicateAPIResponseSchema = z.object({
  id: z.string(),
  status: z.enum(['starting', 'processing', 'succeeded', 'failed', 'canceled']),
  output: z.array(z.url()).nullable(),
  error: z.string().nullable(),
  logs: z.string().optional(),
  metrics: z
    .object({
      predict_time: z.number().optional(),
    })
    .optional(),
});

export type ReplicateAPIResponse = z.infer<typeof ReplicateAPIResponseSchema>;

// ============================================================
// Validation Helpers
// ============================================================

/**
 * 이미지 파일 검증
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'JPG, PNG, WebP 형식만 지원합니다' };
  }

  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: '파일 크기는 10MB 이하여야 합니다' };
  }

  return { valid: true };
};

/**
 * AI 크레딧 충분 여부 확인
 */
export const hasEnoughCredits = (userCredits: number, requiredCredits: number = 1): boolean => {
  return userCredits >= requiredCredits;
};

// ============================================================
// Favorite Toggle Schema
// ============================================================

export const ToggleFavoriteSchema = z.object({
  isFavorited: z.boolean(),
});

export type ToggleFavoriteRequest = z.infer<typeof ToggleFavoriteSchema>;

// ============================================================
// Album Schemas
// ============================================================

export const CreateAlbumSchema = z.object({
  name: z.string().min(1).max(255),
  snapType: z.enum(['STUDIO', 'OUTDOOR', 'CONCEPT']).optional(),
});

export const AlbumGroupSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  sortOrder: z.number().int().min(0),
  isDefault: z.boolean().optional(),
});

export const AlbumImageSchema = z.object({
  url: z.url(),
  generationId: z.string(),
  style: z.string(),
  role: z.enum(['GROOM', 'BRIDE']),
  sortOrder: z.number().int().min(0),
  groupId: z.string().optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
});

export const UpdateAlbumSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  groups: z.array(AlbumGroupSchema).max(20).optional(),
  images: z.array(AlbumImageSchema).max(50).optional(),
});

export const ApplyAlbumSchema = z.object({
  invitationId: z.string().min(1),
});

// ============================================================
// Reference Photo Schemas
// ============================================================

export const CreateReferencePhotoSchema = z.object({
  role: z.enum(['GROOM', 'BRIDE']),
});

export const ReferencePhotoSchema = z.object({
  id: z.string(),
  role: z.enum(['GROOM', 'BRIDE']),
  originalUrl: z.url(),
  faceDetected: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.date(),
});

export type ReferencePhotoResponse = z.infer<typeof ReferencePhotoSchema>;

// ============================================================
// Job Schemas
// ============================================================

export const JobModeSchema = z.enum(['SINGLE', 'BATCH']);
export const JobStatusSchema = z.enum([
  'PENDING', 'PROCESSING', 'COMPLETED', 'PARTIAL', 'FAILED', 'CANCELLED',
]);

export const CreateJobSchema = z.object({
  albumId: z.string().min(1),
  mode: JobModeSchema,
  styles: z.array(z.string()).min(1),
  roles: z.array(z.enum(['GROOM', 'BRIDE'])).min(1),
  modelId: z.string().optional(),
  totalImages: z.number().int().min(1).max(20),
  referencePhotoIds: z.array(z.string()).min(1),
});

export type CreateJobRequest = z.infer<typeof CreateJobSchema>;

export const JobTaskSchema = z.object({
  index: z.number().int().min(0),
  style: z.string(),
  role: z.enum(['GROOM', 'BRIDE']),
  referencePhotoId: z.string(),
});

export const JobResponseSchema = z.object({
  id: z.string(),
  mode: JobModeSchema,
  totalImages: z.number(),
  completedImages: z.number(),
  failedImages: z.number(),
  creditsReserved: z.number(),
  creditsUsed: z.number(),
  status: JobStatusSchema,
  tasks: z.array(JobTaskSchema).optional(),
  createdAt: z.date(),
});

export type JobResponse = z.infer<typeof JobResponseSchema>;

// ============================================================
// Credit Transaction Schemas
// ============================================================

export const CreditTxTypeSchema = z.enum(['DEDUCT', 'REFUND', 'PURCHASE', 'BONUS']);

export const CreditTransactionSchema = z.object({
  id: z.string(),
  type: CreditTxTypeSchema,
  amount: z.number().int(),
  balanceAfter: z.number().int(),
  referenceType: z.string().nullable(),
  referenceId: z.string().nullable(),
  description: z.string().nullable(),
  createdAt: z.date(),
});

export const CreditBalanceResponseSchema = z.object({
  balance: z.number().int().min(0),
  transactions: z.array(CreditTransactionSchema),
});

// ============================================================
// SSE Stream Event Schemas
// ============================================================

export const SSEStatusEventSchema = z.object({
  type: z.literal('status'),
  message: z.string(),
});

export const SSEImageEventSchema = z.object({
  type: z.literal('image'),
  index: z.number().int().min(0),
  url: z.url(),
  progress: z.number().int().min(0),
  total: z.number().int().min(1),
});

export const SSEDoneEventSchema = z.object({
  type: z.literal('done'),
  id: z.string(),
  originalUrl: z.url(),
  generatedUrls: z.array(z.url()),
  style: z.string(),
  albumId: z.string().nullable(),
  remainingCredits: z.number().int().min(0),
  jobProgress: z.object({
    completed: z.number().int(),
    total: z.number().int(),
  }).optional(),
});

export const SSEErrorEventSchema = z.object({
  type: z.literal('error'),
  error: z.string(),
});

export const SSEEventSchema = z.discriminatedUnion('type', [
  SSEStatusEventSchema,
  SSEImageEventSchema,
  SSEDoneEventSchema,
  SSEErrorEventSchema,
]);

export type SSEEvent = z.infer<typeof SSEEventSchema>;
