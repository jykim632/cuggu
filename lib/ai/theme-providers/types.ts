/**
 * 테마 프로바이더 공통 인터페이스
 */

import type { AIThemeModel, ThemeProviderType } from '../theme-models';

export interface ThemeProviderResult {
  /** tool_use / function calling에서 추출한 raw JSON (object) */
  rawJson: unknown;
  inputTokens: number;
  outputTokens: number;
}

export interface ThemeProvider {
  readonly providerType: ThemeProviderType;

  generateTheme(params: {
    systemPrompt: string;
    userPrompt: string;
    jsonSchema: Record<string, unknown>;
    model: AIThemeModel;
  }): Promise<ThemeProviderResult>;
}
