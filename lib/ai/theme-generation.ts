import { SerializableThemeSchema } from '@/schemas/theme';
import { toJSONSchema } from 'zod';
import { THEME_SYSTEM_PROMPT } from './theme-prompt';
import { getThemeProvider } from './theme-providers';
import { calculateThemeCost } from './theme-models';
import type { AIThemeModel } from './theme-models';
import type { SerializableTheme } from '@/lib/templates/types';

// AI가 하이픈 포함 enum 값을 underscore/다른 형태로 생성하는 경우 정규화
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
};

function sanitizeEnums(obj: unknown): unknown {
  if (obj === null || obj === undefined || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeEnums);

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (typeof value === 'string' && ENUM_CORRECTIONS[key]) {
      result[key] = ENUM_CORRECTIONS[key][value] ?? value;
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeEnums(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export interface ThemeGenerationResult {
  theme: SerializableTheme;
  modelId: string;
  cost: number;
  usage: { inputTokens: number; outputTokens: number };
}

/**
 * 프로바이더를 통해 사용자 프롬프트로부터 웨딩 테마를 생성
 *
 * tool_use / function calling으로 JSON 구조를 강제하고, Zod 구조 검증 후 반환.
 * safelist 검증은 caller(API route)에서 처리.
 */
export async function generateTheme(
  userPrompt: string,
  model: AIThemeModel,
): Promise<ThemeGenerationResult> {
  const provider = getThemeProvider(model.providerType);

  // Zod v4 → JSON Schema 변환
  const jsonSchema = toJSONSchema(SerializableThemeSchema) as Record<string, unknown>;

  const result = await provider.generateTheme({
    systemPrompt: THEME_SYSTEM_PROMPT,
    userPrompt: `다음 컨셉으로 웨딩 청첩장 테마를 만들어주세요: ${userPrompt}`,
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
