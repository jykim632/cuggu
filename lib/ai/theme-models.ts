/**
 * AI 테마 생성 모델 레지스트리
 *
 * 사진 생성의 AI_MODELS 패턴을 따라 테마 생성 전용 모델 정의.
 * function calling / tool use로 JSON 테마를 생성하는 LLM 모델들.
 */

export type ThemeProviderType = 'anthropic' | 'openai' | 'gemini';

/** 사용자가 선택하는 테마 생성 모드 */
export type ThemeMode = 'fast' | 'quality';

/** appSettings에 저장되는 테마 설정 */
export interface ThemeGenerationConfig {
  fastModelId: string;
  qualityModelId: string;
}

export const DEFAULT_THEME_CONFIG: ThemeGenerationConfig = {
  fastModelId: 'theme-gemini-flash',
  qualityModelId: 'theme-claude-sonnet',
};

export interface AIThemeModel {
  id: string;
  name: string;
  provider: string;
  providerType: ThemeProviderType;
  providerModel: string;
  /** $ per 1M input tokens */
  inputCostPerMTok: number;
  /** $ per 1M output tokens */
  outputCostPerMTok: number;
  description: string;
  speed: 'fast' | 'medium' | 'slow';
}

export const AI_THEME_MODELS: Record<string, AIThemeModel> = {
  CLAUDE_SONNET: {
    id: 'theme-claude-sonnet',
    name: 'Claude Sonnet 4.5',
    provider: 'Anthropic',
    providerType: 'anthropic',
    providerModel: 'claude-sonnet-4-5-20250929',
    inputCostPerMTok: 3,
    outputCostPerMTok: 15,
    description: '최고 품질, 안정적인 JSON 구조',
    speed: 'medium',
  },
  GPT_4O: {
    id: 'theme-gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    providerType: 'openai',
    providerModel: 'gpt-4o',
    inputCostPerMTok: 2.5,
    outputCostPerMTok: 10,
    description: '빠르고 안정적, 중간 비용',
    speed: 'fast',
  },
  GEMINI_FLASH: {
    id: 'theme-gemini-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    providerType: 'gemini',
    providerModel: 'gemini-2.5-flash',
    inputCostPerMTok: 0.15,
    outputCostPerMTok: 0.60,
    description: '초저가, 빠른 생성',
    speed: 'fast',
  },
};

/**
 * 모델 ID로 AIThemeModel 찾기
 */
export function findThemeModelById(modelId: string): AIThemeModel | undefined {
  return Object.values(AI_THEME_MODELS).find((m) => m.id === modelId);
}

/**
 * 토큰 사용량으로 비용 계산 (USD)
 */
export function calculateThemeCost(
  model: AIThemeModel,
  inputTokens: number,
  outputTokens: number,
): number {
  return (
    (inputTokens * model.inputCostPerMTok + outputTokens * model.outputCostPerMTok) / 1_000_000
  );
}
