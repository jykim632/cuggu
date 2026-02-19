/**
 * OpenAI 프로바이더 (gpt-image-1, dall-e-3)
 */

import OpenAI, { toFile } from 'openai';
import type { GenerationProvider, ImageOutput } from './types';

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required for OpenAI models');
  }
  return new OpenAI({ apiKey });
}

async function downloadImageAsBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

export const openaiProvider: GenerationProvider = {
  providerType: 'openai',

  async generateImage({ prompt, imageUrls, modelConfig, variationIndex }): Promise<ImageOutput> {
    const openai = getOpenAIClient();
    const fullPrompt = `${prompt}, variation ${variationIndex + 1}`;

    if (modelConfig.id === 'dall-e-3') {
      // DALL-E 3: 텍스트 전용 생성 (참조 이미지 불가)
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: fullPrompt,
        size: '1024x1792', // 세로 비율 (웨딩 사진)
        quality: 'standard',
        response_format: 'b64_json',
        n: 1,
      });

      const b64 = response.data?.[0]?.b64_json;
      if (!b64) throw new Error('DALL-E 3 returned no image data');

      return {
        type: 'base64',
        data: b64,
        mimeType: 'image/png',
        providerJobId: `openai-dalle3-${Date.now()}-${variationIndex}`,
      };
    }

    // gpt-image-1: 모든 참조 이미지를 배열로 전달 (커플 모드: 2장, 솔로: 1장)
    const imageFiles = await Promise.all(
      imageUrls.map(async (url, i) => {
        const buffer = await downloadImageAsBuffer(url);
        return toFile(buffer, `reference-${i}.png`, { type: 'image/png' });
      })
    );

    const response = await openai.images.edit({
      model: 'gpt-image-1',
      image: imageFiles,
      prompt: `${fullPrompt}, keeping the exact same faces from the reference images, identical facial features, preserve each person's face`,
      size: '1024x1536', // 세로 비율
    });

    const editB64 = response.data?.[0]?.b64_json;
    if (!editB64) throw new Error('GPT Image returned no image data');

    return {
      type: 'base64',
      data: editB64,
      mimeType: 'image/png',
      providerJobId: `openai-gptimage-${Date.now()}-${variationIndex}`,
    };
  },
};
