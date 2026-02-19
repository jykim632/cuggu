/**
 * AI 사진 생성 관련 타입 정의
 */

export type AIStyle =
  | 'CLASSIC_STUDIO'
  | 'OUTDOOR_GARDEN'
  | 'SUNSET_BEACH'
  | 'TRADITIONAL_HANBOK'
  | 'VINTAGE_CINEMATIC'
  | 'LUXURY_HOTEL'
  | 'CITY_LIFESTYLE'
  | 'ENCHANTED_FOREST'
  | 'BLACK_AND_WHITE'
  | 'MINIMALIST_GALLERY';

export type PersonRole = 'GROOM' | 'BRIDE' | 'COUPLE';

export interface AIGenerationResult {
  id: string;
  urls: string[];
  selected: string | null;
}

export interface AIStyleInfo {
  value: AIStyle;
  label: string;
  description: string;
  thumbnail?: string;
}

export const AI_STYLES: AIStyleInfo[] = [
  {
    value: 'CLASSIC_STUDIO',
    label: '클래식 스튜디오',
    description: '정석적인 스튜디오 화보',
  },
  {
    value: 'OUTDOOR_GARDEN',
    label: '야외 가든',
    description: '자연광 정원 로맨스',
  },
  {
    value: 'SUNSET_BEACH',
    label: '해변 일몰',
    description: '열대 해변 석양',
  },
  {
    value: 'TRADITIONAL_HANBOK',
    label: '전통 한복',
    description: '고궁/한옥 배경 혼례복',
  },
  {
    value: 'VINTAGE_CINEMATIC',
    label: '빈티지 영화',
    description: '50-60년대 필름 감성',
  },
  {
    value: 'LUXURY_HOTEL',
    label: '럭셔리 호텔',
    description: '샹들리에 호텔 볼룸',
  },
  {
    value: 'CITY_LIFESTYLE',
    label: '도시 스냅',
    description: '도심 스트릿 스냅',
  },
  {
    value: 'ENCHANTED_FOREST',
    label: '동화 숲',
    description: '몽환적인 숲속 요정',
  },
  {
    value: 'BLACK_AND_WHITE',
    label: '흑백 포트릿',
    description: '시대초월 흑백 감성',
  },
  {
    value: 'MINIMALIST_GALLERY',
    label: '미니멀리즘',
    description: '갤러리 아트 스타일',
  },
];

// ── Album Types ──

export type SnapType = 'STUDIO' | 'OUTDOOR' | 'CONCEPT';

export interface SnapTypeInfo {
  value: SnapType;
  label: string;
  description: string;
  styles: AIStyle[];
}

export const SNAP_TYPES: SnapTypeInfo[] = [
  {
    value: 'STUDIO',
    label: '스튜디오 스냅',
    description: '클래식한 실내 웨딩 화보',
    styles: ['CLASSIC_STUDIO', 'LUXURY_HOTEL', 'MINIMALIST_GALLERY', 'BLACK_AND_WHITE'],
  },
  {
    value: 'OUTDOOR',
    label: '야외 스냅',
    description: '자연광 속 로맨틱 야외 촬영',
    styles: ['OUTDOOR_GARDEN', 'SUNSET_BEACH', 'ENCHANTED_FOREST'],
  },
  {
    value: 'CONCEPT',
    label: '컨셉 스냅',
    description: '한복, 빈티지, 시티 등 테마 촬영',
    styles: ['TRADITIONAL_HANBOK', 'VINTAGE_CINEMATIC', 'CITY_LIFESTYLE'],
  },
];

// 앨범 내 그룹 (섹션)
export interface AlbumGroup {
  id: string;
  name: string;
  sortOrder: number;
  isDefault?: boolean;
}

export interface AlbumImage {
  url: string;
  generationId: string;
  style: AIStyle;
  role: PersonRole;
  sortOrder: number;
  groupId?: string;
  tags?: string[];
}

// 프리셋 태그
export const PRESET_TAGS = ['베스트샷', '미공개', '인스타용', '청첩장용', '프로필'] as const;
export type PresetTag = typeof PRESET_TAGS[number];

// ── Job Types ──

export type JobMode = 'SINGLE' | 'BATCH';
export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'PARTIAL' | 'FAILED' | 'CANCELLED';
export type CreditTxType = 'DEDUCT' | 'REFUND' | 'PURCHASE' | 'BONUS';

export interface JobConfig {
  snapType?: SnapType;
  styles: AIStyle[];
  roles: PersonRole[];
  modelId?: string;
  groomRefId?: string;
  brideRefId?: string;
}

export interface JobTask {
  index: number;
  style: AIStyle;
  role: PersonRole;
  referencePhotoIds: string[];
}

export interface ReferencePhoto {
  id: string;
  role: PersonRole;
  originalUrl: string;
  faceDetected: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface CreditTransaction {
  id: string;
  type: CreditTxType;
  amount: number;
  balanceAfter: number;
  referenceType: string | null;
  referenceId: string | null;
  description: string | null;
  createdAt: string;
}

// ── Constants ──

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
