/**
 * AI 생성 시스템 상수
 */
export const AI_CONFIG = {
  /** 최대 파일 크기 (10MB) */
  MAX_FILE_SIZE: 10 * 1024 * 1024,

  /** Rate limit - 요청 수 */
  RATE_LIMIT_REQUESTS: 5,

  /** Rate limit - 시간 윈도우 (초) */
  RATE_LIMIT_WINDOW: 600, // 10분

  /** 생성할 이미지 수 */
  BATCH_SIZE: 4,

  /** 허용 파일 타입 */
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/jpg'] as const,
} as const;

/** 파일 시그니처 (Magic Number) */
export const FILE_SIGNATURES = {
  PNG: [0x89, 0x50, 0x4e, 0x47] as const,
  JPEG_START: [0xff, 0xd8, 0xff] as const,
} as const;
