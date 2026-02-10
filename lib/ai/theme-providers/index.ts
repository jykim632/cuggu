/**
 * 테마 프로바이더 라우터
 */

import type { ThemeProvider } from './types';
import type { ThemeProviderType } from '../theme-models';
import { anthropicThemeProvider } from './anthropic';
import { openaiThemeProvider } from './openai';
import { geminiThemeProvider } from './gemini';

const providers: Record<ThemeProviderType, ThemeProvider> = {
  anthropic: anthropicThemeProvider,
  openai: openaiThemeProvider,
  gemini: geminiThemeProvider,
};

export function getThemeProvider(providerType: ThemeProviderType): ThemeProvider {
  const provider = providers[providerType];
  if (!provider) {
    throw new Error(`Unknown theme provider: ${providerType}`);
  }
  return provider;
}
