/**
 * AI 사진 생성 관련 타입 정의
 */

export type AIStyle = 'CLASSIC' | 'MODERN' | 'VINTAGE' | 'ROMANTIC' | 'CINEMATIC';

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
}

export const AI_STYLES: AIStyleInfo[] = [
  {
    value: 'CLASSIC',
    label: '클래식',
    description: '전통적인 한국식 웨딩',
  },
  {
    value: 'MODERN',
    label: '모던',
    description: '미니멀하고 세련된 스타일',
  },
  {
    value: 'VINTAGE',
    label: '빈티지',
    description: '따뜻한 복고풍',
  },
  {
    value: 'ROMANTIC',
    label: '로맨틱',
    description: '부드럽고 몽환적인 분위기',
  },
  {
    value: 'CINEMATIC',
    label: '시네마틱',
    description: '드라마틱한 화보 스타일',
  },
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
