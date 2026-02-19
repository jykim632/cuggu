/**
 * AI 프로바이더 공통 인터페이스
 */

import type { AIModel } from '../models';

export type ProviderType = 'openai' | 'gemini';

export interface ImageOutput {
  /** base64 인코딩 이미지 (OpenAI, Gemini) */
  type: 'base64';
  data: string;
  mimeType?: string;
  providerJobId: string;
}

export interface GenerationProvider {
  readonly providerType: ProviderType;

  generateImage(params: {
    prompt: string;
    imageUrls: string[];
    modelConfig: AIModel;
    variationIndex: number;
  }): Promise<ImageOutput>;
}
