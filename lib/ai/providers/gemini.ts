/**
 * Google Gemini 프로바이더
 *
 * Gemini 네이티브 이미지 생성: generateContent() + responseModalities: ['image']
 * - gemini-2.5-flash-image: 빠르고 저렴
 * - gemini-3-pro-image-preview: 고품질, 2K/4K 지원
 *
 * 참조 이미지 입력 + 이미지 출력 모두 지원
 */

import { GoogleGenAI } from '@google/genai';
import type { GenerationProvider, ImageOutput } from './types';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY is required for Gemini models');
  }
  return new GoogleGenAI({ apiKey });
}

async function downloadImageAsBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const mimeType = response.headers.get('content-type') || 'image/png';
  return { base64: buffer.toString('base64'), mimeType };
}

export const geminiProvider: GenerationProvider = {
  providerType: 'gemini',

  async generateImage({ prompt, imageUrls, modelConfig, variationIndex }): Promise<ImageOutput> {
    const ai = getGeminiClient();
    const fullPrompt = `${prompt}, keeping the exact same faces, identical facial features, preserve each person's face from the reference images, variation ${variationIndex + 1}`;

    // 모든 참조 이미지를 inlineData parts로 전달
    const parts: any[] = [];

    if (modelConfig.supportsReferenceImage) {
      for (const url of imageUrls) {
        const { base64, mimeType } = await downloadImageAsBase64(url);
        parts.push({
          inlineData: { mimeType, data: base64 },
        });
      }
    }

    parts.push({ text: fullPrompt });

    const response = await ai.models.generateContent({
      model: modelConfig.providerModel,
      contents: [{ role: 'user', parts }],
      config: {
        responseModalities: ['image', 'text'],
      },
    });

    // 응답에서 이미지 파트 추출
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error('Gemini returned no candidates');
    }

    const responseParts = candidates[0].content?.parts;
    if (!responseParts) {
      throw new Error('Gemini returned no content parts');
    }

    const imagePart = responseParts.find((p: any) => p.inlineData);
    if (!imagePart?.inlineData?.data) {
      throw new Error('Gemini returned no image data');
    }

    return {
      type: 'base64',
      data: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType || 'image/png',
      providerJobId: `gemini-${Date.now()}-${variationIndex}`,
    };
  },
};
