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

export type PersonRole = 'GROOM' | 'BRIDE';

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

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
