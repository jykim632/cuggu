/**
 * 프로바이더 라우터
 */

import type { GenerationProvider, ProviderType } from './types';
import { openaiProvider } from './openai';
import { geminiProvider } from './gemini';

const providers: Record<ProviderType, GenerationProvider> = {
  openai: openaiProvider,
  gemini: geminiProvider,
};

export function getProvider(providerType: ProviderType): GenerationProvider {
  const provider = providers[providerType];
  if (!provider) {
    throw new Error(`Unknown provider: ${providerType}`);
  }
  return provider;
}
