import { z } from 'zod';

/**
 * AI 생성 시스템 환경 변수 검증
 */
const envSchema = z.object({
  // AWS S3
  AWS_REGION: z.string().min(1, 'AWS_REGION is required'),
  AWS_ACCESS_KEY_ID: z.string().min(1, 'AWS_ACCESS_KEY_ID is required'),
  AWS_SECRET_ACCESS_KEY: z.string().min(1, 'AWS_SECRET_ACCESS_KEY is required'),
  S3_BUCKET_NAME: z.string().min(1, 'S3_BUCKET_NAME is required'),

  // Azure Face API
  AZURE_FACE_API_KEY: z.string().min(1, 'AZURE_FACE_API_KEY is required'),
  AZURE_FACE_ENDPOINT: z.string().url('AZURE_FACE_ENDPOINT must be a valid URL'),

  // Replicate
  REPLICATE_API_TOKEN: z.string().min(1, 'REPLICATE_API_TOKEN is required'),

  // Upstash Redis
  UPSTASH_REDIS_REST_URL: z.string().url('UPSTASH_REDIS_REST_URL must be a valid URL'),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1, 'UPSTASH_REDIS_REST_TOKEN is required'),
});

// 앱 시작 시 검증 (실패 시 에러 throw)
export const env = envSchema.parse(process.env);
