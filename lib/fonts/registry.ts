// ── 폰트 선택 시스템 레지스트리 ──
// 7개 한글 폰트 + 3단계 텍스트 크기

export type FontId =
  | 'noto-sans'
  | 'pretendard'
  | 'noto-serif'
  | 'gowun-batang'
  | 'nanum-myeongjo'
  | 'maruburi'
  | 'kopub-batang';

export type FontCategory = 'sans-serif' | 'serif';

export interface FontDefinition {
  id: FontId;
  name: string;
  nameKo: string;
  category: FontCategory;
  /** CSS variable name (e.g., '--font-sans') */
  cssVariable: string;
}

export const FONT_REGISTRY: FontDefinition[] = [
  {
    id: 'noto-sans',
    name: 'Noto Sans KR',
    nameKo: '노토 산스',
    category: 'sans-serif',
    cssVariable: '--font-sans',
  },
  {
    id: 'pretendard',
    name: 'Pretendard',
    nameKo: '프리텐다드',
    category: 'sans-serif',
    cssVariable: '--font-pretendard',
  },
  {
    id: 'noto-serif',
    name: 'Noto Serif KR',
    nameKo: '노토 세리프',
    category: 'serif',
    cssVariable: '--font-serif',
  },
  {
    id: 'gowun-batang',
    name: 'Gowun Batang',
    nameKo: '고운 바탕',
    category: 'serif',
    cssVariable: '--font-batang',
  },
  {
    id: 'nanum-myeongjo',
    name: 'Nanum Myeongjo',
    nameKo: '나눔 명조',
    category: 'serif',
    cssVariable: '--font-myeongjo',
  },
  {
    id: 'maruburi',
    name: 'MaruBuri',
    nameKo: '마루부리',
    category: 'serif',
    cssVariable: '--font-maruburi',
  },
  {
    id: 'kopub-batang',
    name: 'KoPub Batang',
    nameKo: '코퍼브 바탕',
    category: 'serif',
    cssVariable: '--font-kopub',
  },
];

export const FONT_MAP = Object.fromEntries(
  FONT_REGISTRY.map((f) => [f.id, f]),
) as Record<FontId, FontDefinition>;

// ── 텍스트 크기 ──

export type TextScale = 'sm' | 'md' | 'lg';

export const TEXT_SCALE_VALUES: Record<TextScale, number> = {
  sm: 0.92,
  md: 1,
  lg: 1.08,
};

export const TEXT_SCALE_LABELS: Record<TextScale, string> = {
  sm: '작게',
  md: '보통',
  lg: '크게',
};

// ── 폰트 스타일 생성 ──
// BaseTemplate 루트에 적용할 CSS 스타일 객체 생성
// 선택된 폰트의 CSS 변수로 모든 font-* 변수를 오버라이드

/** 모든 폰트 CSS 변수 키 */
const ALL_FONT_VARS = [
  '--font-sans',
  '--font-serif',
  '--font-batang',
  '--font-myeongjo',
  '--font-maruburi',
  '--font-kopub',
  '--font-pretendard',
] as const;

export function buildFontStyle(
  fontFamily?: string,
  textScale?: string,
): React.CSSProperties | undefined {
  const fontId = fontFamily as FontId | undefined;
  const scale = (textScale as TextScale) || 'md';

  const hasFont = fontId && FONT_MAP[fontId];
  const hasScale = scale !== 'md';

  if (!hasFont && !hasScale) return undefined;

  const style: Record<string, string | number> = {};

  if (hasFont) {
    const font = FONT_MAP[fontId];
    const fontValue = `var(${font.cssVariable})`;

    // 직접 font-family 설정 (font-* 클래스 없는 텍스트용)
    style.fontFamily = fontValue;

    // 모든 폰트 CSS 변수를 선택된 폰트로 오버라이드
    // → font-serif, font-batang 등 Tailwind 클래스도 선택된 폰트 사용
    // 단, 선택된 폰트 자신의 변수는 제외 (순환 참조 방지)
    for (const varName of ALL_FONT_VARS) {
      if (varName !== font.cssVariable) {
        style[varName] = fontValue;
      }
    }
  }

  if (hasScale) {
    style.zoom = TEXT_SCALE_VALUES[scale];
  }

  return style as React.CSSProperties;
}
