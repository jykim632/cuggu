import { SerializableThemeSchema } from '@/schemas/theme';
import { toJSONSchema } from 'zod';
import { buildSystemPrompt } from './theme-prompt';
import { getThemeProvider } from './theme-providers';
import { calculateThemeCost } from './theme-models';
import type { AIThemeModel } from './theme-models';
import type { SerializableTheme } from '@/lib/templates/types';
import type { ThemeContextResult } from './theme-context';

// ── Enum 교정 (AI가 하이픈을 underscore/space로 출력하는 경우) ──

const ENUM_CORRECTIONS: Record<string, Record<string, string>> = {
  type: {
    symbol_with_lines: 'symbol-with-lines',
    'symbol with lines': 'symbol-with-lines',
    diamond_with_lines: 'diamond-with-lines',
    'diamond with lines': 'diamond-with-lines',
    horizontal_line: 'horizontal-line',
    'horizontal line': 'horizontal-line',
    vertical_line: 'vertical-line',
    'vertical line': 'vertical-line',
    gradient_line: 'gradient-line',
    'gradient line': 'gradient-line',
    text_label: 'text-label',
    'text label': 'text-label',
    with_decoration: 'with-decoration',
    'with decoration': 'with-decoration',
    with_sub_label: 'with-sub-label',
    'with sub label': 'with-sub-label',
  },
  preset: {
    slide_x_left: 'slide-x-left',
    slide_x_right: 'slide-x-right',
    slide_y: 'slide-y',
    fade_scale: 'fade-scale',
  },
  layout: {
    bottom_left: 'bottom-left',
    'bottom left': 'bottom-left',
    flex_between: 'flex-between',
    'flex between': 'flex-between',
  },
  nameDivider: {
    lines_only: 'lines-only',
    'lines only': 'lines-only',
    lines_with_ampersand: 'lines-with-ampersand',
    'lines with ampersand': 'lines-with-ampersand',
  },
  galleryLayout: {
    grid_2: 'grid-2', grid_3: 'grid-3', grid_2_1: 'grid-2-1',
    'grid 2 1': 'grid-2-1', single_column: 'single-column', 'single column': 'single-column',
  },
  parentsLayout: {
    side_by_side: 'side-by-side', 'side by side': 'side-by-side',
  },
  greetingLayout: {
    left_aligned: 'left-aligned', 'left aligned': 'left-aligned',
    quote_style: 'quote-style', 'quote style': 'quote-style',
  },
  ceremonyLayout: {},
  sectionSpacing: {},
};

const ENUM_VALID_VALUES: Record<string, { values: Set<string>; fallback: string }> = {
  type: {
    values: new Set([
      'none', 'emoji', 'symbol-with-lines', 'diamond-with-lines', 'text-label',
      'horizontal-line', 'vertical-line', 'gradient-line',
      'default', 'with-decoration', 'with-sub-label',
    ]),
    fallback: 'none',
  },
  preset: {
    values: new Set(['fade', 'slide-x-left', 'slide-x-right', 'slide-y', 'scale', 'fade-scale']),
    fallback: 'fade',
  },
  layout: {
    values: new Set(['center', 'bottom-left', 'centered', 'flex-between']),
    fallback: 'center',
  },
  nameDivider: {
    values: new Set(['ampersand', 'lines-only', 'lines-with-ampersand']),
    fallback: 'ampersand',
  },
  galleryLayout: {
    values: new Set(['grid-2', 'grid-3', 'grid-2-1', 'single-column', 'masonry']),
    fallback: 'grid-2',
  },
  parentsLayout: {
    values: new Set(['side-by-side', 'stacked', 'compact', 'cards']),
    fallback: 'side-by-side',
  },
  greetingLayout: {
    values: new Set(['centered', 'left-aligned', 'quote-style']),
    fallback: 'centered',
  },
  ceremonyLayout: {
    values: new Set(['cards', 'centered', 'inline', 'timeline']),
    fallback: 'cards',
  },
  sectionSpacing: {
    values: new Set(['compact', 'normal', 'spacious']),
    fallback: 'normal',
  },
};

function sanitizeEnums(obj: unknown): unknown {
  if (obj === null || obj === undefined || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeEnums);

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (typeof value === 'string' && ENUM_CORRECTIONS[key]) {
      const corrected = ENUM_CORRECTIONS[key][value] ?? value;
      const valid = ENUM_VALID_VALUES[key];
      result[key] = valid && !valid.values.has(corrected) ? valid.fallback : corrected;
    } else if (typeof value === 'string' && ENUM_VALID_VALUES[key]) {
      const valid = ENUM_VALID_VALUES[key];
      result[key] = valid.values.has(value) ? value : valid.fallback;
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeEnums(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

// ── 랜덤 유틸 ──

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── 레이아웃 시드 생성 (전체 6개 축 + 커버) ──

interface LayoutSeed {
  galleryLayout: string;
  parentsLayout: string;
  parentsFullHeight: boolean;
  greetingLayout: string;
  ceremonyLayout: string;
  sectionSpacing: string;
  coverLayout: string;
  coverNameDivider: string;
}

function generateLayoutSeed(): LayoutSeed {
  return {
    galleryLayout: pick(['grid-2', 'grid-3', 'grid-2-1', 'single-column', 'masonry']),
    parentsLayout: pick(['side-by-side', 'stacked', 'compact', 'cards']),
    parentsFullHeight: pick([true, false]),
    greetingLayout: pick(['centered', 'left-aligned', 'quote-style']),
    ceremonyLayout: pick(['cards', 'centered', 'inline', 'timeline']),
    sectionSpacing: pick(['compact', 'normal', 'spacious']),
    coverLayout: pick(['center', 'bottom-left']),
    coverNameDivider: pick(['ampersand', 'lines-only', 'lines-with-ampersand']),
  };
}

function formatLayoutSeed(seed: LayoutSeed): string {
  return [
    `[Layout Seed]`,
    `gallery=${seed.galleryLayout}, parents=${seed.parentsLayout}, parentsFullHeight=${seed.parentsFullHeight}`,
    `greeting=${seed.greetingLayout}, ceremony=${seed.ceremonyLayout}`,
    `spacing=${seed.sectionSpacing}, cover=${seed.coverLayout}, nameDivider=${seed.coverNameDivider}`,
    `Use this combination as your starting structure. Adapt freely if the user's concept requires it.`,
  ].join('\n');
}

// ── 컨텍스트 기반 분위기 힌트 ──

function buildContextHint(ctx: ThemeContextResult | null): string {
  if (!ctx) return '';

  const hints: string[] = [];

  // 계절 → 색감/분위기 가이드
  if (ctx.season) {
    const seasonGuide: Record<string, string> = {
      '봄': 'Spring wedding: consider soft pinks, fresh greens, light florals. Mood: tender, hopeful.',
      '여름': 'Summer wedding: consider cool blues, whites, clean greens. Mood: fresh, bright, breezy.',
      '가을': 'Autumn wedding: consider warm ambers, deep reds, earthy tones. Mood: warm, rich, mature.',
      '겨울': 'Winter wedding: consider navy, silver, deep burgundy, or crisp white+gold. Mood: elegant, intimate.',
    };
    if (seasonGuide[ctx.season]) hints.push(seasonGuide[ctx.season]);
  }

  // 장소 유형 → 격식 가이드
  if (ctx.venueType) {
    const venueGuide: Record<string, string> = {
      '호텔 웨딩': 'Hotel venue: lean formal/luxurious. Serif fonts, structured layouts, subtle gold/neutral accents.',
      '가든/야외 웨딩': 'Garden venue: lean natural/organic. Soft colors, rounded shapes, botanical emoji if any.',
      '교회/성당 웨딩': 'Church venue: lean classic/reverent. Serif fonts, traditional layouts, muted colors.',
      '한옥/전통 웨딩': 'Traditional Korean venue: lean warm/cultural. Batang font, traditional spacing, warm earth tones.',
      '웨딩홀': 'Wedding hall: versatile — match the user\'s concept freely.',
    };
    if (venueGuide[ctx.venueType]) hints.push(venueGuide[ctx.venueType]);
  }

  // 갤러리 규모 → 레이아웃 힌트
  if (ctx.galleryScale) {
    hints.push('Many gallery photos: consider grid-3 or masonry for density, or grid-2-1 for editorial variety.');
  }

  // 인사말 톤 → 전체 톤 힌트
  if (ctx.greetingTone === '격식체') {
    hints.push('Formal greeting tone detected: match with serif/batang fonts and structured, respectful layout.');
  } else if (ctx.greetingTone === '캐주얼') {
    hints.push('Casual greeting tone: OK to use modern/playful styles, sans-serif, relaxed spacing.');
  }

  if (hints.length === 0) return '';

  return '\n\n[Context]\n' + hints.join('\n');
}

// ── 디자이너 페르소나 랜덤 선택 ──

type DesignerVariant = 'editorial' | 'romantic' | 'avant-garde';

function pickDesignerVariant(): DesignerVariant {
  return pick(['editorial', 'romantic', 'avant-garde'] as const);
}

// ── 공개 API ──

export interface ThemeGenerationResult {
  theme: SerializableTheme;
  modelId: string;
  cost: number;
  usage: { inputTokens: number; outputTokens: number };
}

export interface ThemeGenerationOptions {
  /** 청첩장 데이터에서 추출한 컨텍스트 (계절, 장소, 톤 등) */
  context?: ThemeContextResult | null;
  /** 디자이너 페르소나 고정 (미지정 시 랜덤) */
  designerVariant?: DesignerVariant;
  /** 레이아웃 시드 고정 (미지정 시 랜덤 생성) */
  layoutSeed?: LayoutSeed;
}

/**
 * AI 프로바이더를 통해 사용자 프롬프트로부터 웨딩 테마를 생성.
 *
 * v2 개선점:
 * - 전체 레이아웃 시드 (6축 + 커버) 랜덤 주입
 * - 컨텍스트 기반 분위기 힌트 (계절, 장소, 톤)
 * - 디자이너 페르소나 로테이션 (편집/로맨틱/아방가르드)
 * - anchor bias 제거 (전체 JSON 예시 제거)
 *
 * tool_use / function calling으로 JSON 구조를 강제하고, Zod 구조 검증 후 반환.
 * safelist 검증은 caller(API route)에서 처리.
 */
export async function generateTheme(
  userPrompt: string,
  model: AIThemeModel,
  options?: ThemeGenerationOptions,
): Promise<ThemeGenerationResult> {
  const provider = getThemeProvider(model.providerType);

  // 시스템 프롬프트: 디자이너 페르소나 로테이션
  const designerVariant = options?.designerVariant ?? pickDesignerVariant();
  const systemPrompt = buildSystemPrompt({ designerVariant });

  // 유저 프롬프트 조립: 컨셉 + 컨텍스트 힌트 + 레이아웃 시드
  const layoutSeed = options?.layoutSeed ?? generateLayoutSeed();
  const contextHint = buildContextHint(options?.context ?? null);
  const userMessage = [
    `다음 컨셉으로 웨딩 청첩장 테마를 만들어주세요: ${userPrompt}`,
    contextHint,
    '',
    formatLayoutSeed(layoutSeed),
  ].join('\n');

  // Zod v4 → JSON Schema 변환
  const jsonSchema = toJSONSchema(SerializableThemeSchema) as Record<string, unknown>;

  const result = await provider.generateTheme({
    systemPrompt,
    userPrompt: userMessage,
    jsonSchema,
    model,
  });

  // AI 출력 정규화 (하이픈 enum 값 교정) → Zod 구조 검증
  const sanitized = sanitizeEnums(result.rawJson);
  const parsed = SerializableThemeSchema.parse(sanitized);

  const cost = calculateThemeCost(model, result.inputTokens, result.outputTokens);

  return {
    theme: parsed as unknown as SerializableTheme,
    modelId: model.id,
    cost,
    usage: {
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
    },
  };
}
