import Replicate from 'replicate';
import { env } from './env';

const replicate = new Replicate({
  auth: env.REPLICATE_API_TOKEN,
});

/**
 * AI 생성 비용 (USD per image)
 * Replicate Flux 1.1 Pro 기준
 */
const COST_PER_IMAGE = parseFloat(process.env.REPLICATE_COST_PER_IMAGE || '0.04');

export type AIStyle =
  | 'CLASSIC'
  | 'MODERN'
  | 'VINTAGE'
  | 'ROMANTIC'
  | 'CINEMATIC';

const STYLE_PROMPTS: Record<AIStyle, string> = {
  CLASSIC:
    'elegant traditional Korean wedding hanbok, soft lighting, professional studio photography',
  MODERN:
    'contemporary wedding dress, minimalist background, natural light, editorial style',
  VINTAGE:
    'vintage wedding attire, warm sepia tones, romantic atmosphere, film photography',
  ROMANTIC: 'romantic wedding scene, soft focus, dreamy lighting, pastel colors',
  CINEMATIC:
    'cinematic wedding portrait, dramatic lighting, high fashion, magazine cover',
};

/**
 * Replicate로 웨딩 사진 4장 생성
 *
 * @param imageUrl - 원본 사진 URL (S3)
 * @param style - 웨딩 스타일
 * @returns 생성된 4장의 URL 배열
 */
export async function generateWeddingPhotos(
  imageUrl: string,
  style: AIStyle
): Promise<{
  urls: string[];
  replicateId: string;
  cost: number;
}> {
  const prompt = STYLE_PROMPTS[style];

  // Flux 모델 사용 (Replicate)
  // run() 메서드는 prediction을 생성하고 자동으로 완료를 기다림
  const prediction = await replicate.predictions.create({
    model: 'black-forest-labs/flux-1.1-pro',
    input: {
      prompt: `${prompt}, based on this face reference`,
      image: imageUrl,
      num_outputs: 4,
      aspect_ratio: '3:4',
      output_format: 'png',
      output_quality: 90,
    },
  });

  // Prediction 완료 대기
  const completed = await replicate.wait(prediction);
  const output = completed.output as string[];

  // Replicate는 배열로 4개 URL 반환
  if (!Array.isArray(output) || output.length !== 4) {
    throw new Error('Unexpected Replicate output format');
  }

  // 비용 계산
  const cost = 4 * COST_PER_IMAGE;

  return {
    urls: output,
    replicateId: prediction.id,
    cost,
  };
}
