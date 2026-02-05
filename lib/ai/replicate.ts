import Replicate from 'replicate';
import { env } from './env';
import { AI_CONFIG } from './constants';
import { AI_MODELS, DEFAULT_MODEL } from './models';

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
 * @param role - 신랑/신부 구분
 * @param modelId - 사용할 AI 모델 (개발 모드)
 * @returns 생성된 4장의 URL 배열
 */
export async function generateWeddingPhotos(
  imageUrl: string,
  style: AIStyle,
  role: 'GROOM' | 'BRIDE',
  modelId?: string
): Promise<{
  urls: string[];
  replicateId: string;
  cost: number;
}> {
  const selectedModelId = modelId || DEFAULT_MODEL;

  // 모델 ID로 찾기 (키가 아닌 id 필드로)
  const model = Object.values(AI_MODELS).find((m) => m.id === selectedModelId);

  if (!model) {
    throw new Error(`Unknown model: ${selectedModelId}`);
  }

  const basePrompt = STYLE_PROMPTS[style];

  // 성별별 의상 추가
  const genderPrompt =
    role === 'GROOM'
      ? 'handsome Korean groom in elegant black tuxedo and bow tie'
      : 'beautiful Korean bride in white wedding dress';

  const prompt = `${genderPrompt}, ${basePrompt}`;

  // TODO: Replicate Webhook으로 비동기 처리
  // - 현재: 동기 대기 (20-40초 블로킹)
  // - 개선: webhook으로 PENDING 상태 즉시 반환, 완료 시 업데이트
  // - 참고: https://replicate.com/docs/webhooks

  // 모델별 input 파라미터 구성
  const getModelInput = (i: number) => {
    const baseInput = {
      prompt: `${prompt}, keeping the exact same face, identical facial features, preserve the person's face from the reference image, variation ${i + 1}`,
      image: imageUrl,
    };

    // 모델별 특화 파라미터
    switch (model.id) {
      case 'flux-pro':
      case 'flux-dev':
        return {
          ...baseInput,
          aspect_ratio: '3:4',
          output_format: 'png',
          output_quality: 90,
          prompt_strength: 0.85,
        };
      case 'photomaker':
        return {
          ...baseInput,
          num_steps: 20,
          style_strength_ratio: 20,
          input_image: imageUrl,
          style_name: 'Photographic (Default)',
        };
      case 'sdxl-faceid':
        return {
          ...baseInput,
          negative_prompt: 'bad quality, low resolution, blurry',
          num_inference_steps: 30,
          guidance_scale: 7.5,
        };
      case 'face-to-sticker':
        return {
          ...baseInput,
          steps: 20,
          width: 768,
          height: 1024,
          upscale: false,
        };
      case 'instant-id':
        return {
          ...baseInput,
          negative_prompt: 'bad quality, worst quality, low resolution',
          num_inference_steps: 30,
          guidance_scale: 5.0,
          ip_adapter_scale: 0.8,
        };
      case 'face-to-many':
        return {
          ...baseInput,
          style: 'Photographic (Default)',
          prompt_strength: 4.5,
        };
      case 'pulid':
        return {
          ...baseInput,
          negative_prompt: 'bad quality, low resolution',
          num_inference_steps: 4,
          guidance_scale: 1.2,
          id_weight: 1.0,
        };
      case 'face-swap':
        return {
          target_image: imageUrl,
          swap_image: imageUrl,
          cache_days: 0,
        };
      default:
        return {
          ...baseInput,
          output_format: 'png',
        };
    }
  };

  // 4장 순차 생성
  const urls: string[] = [];
  const predictionIds: string[] = [];

  for (let i = 0; i < AI_CONFIG.BATCH_SIZE; i++) {
    const prediction = await replicate.predictions.create({
      model: model.replicateModel,
      input: getModelInput(i) as any,
    });

    predictionIds.push(prediction.id);

    // 완료 대기
    const completed = await replicate.wait(prediction);
    const output = completed.output as string;

    if (typeof output !== 'string') {
      throw new Error(
        `Unexpected Replicate output format: expected string, got ${typeof output}`
      );
    }

    urls.push(output);
  }

  // 비용 계산 (모델별)
  const cost = AI_CONFIG.BATCH_SIZE * model.costPerImage;

  return {
    urls,
    replicateId: predictionIds[0],
    cost,
  };
}

/**
 * 스트리밍 방식 웨딩 사진 생성 (1장씩 콜백)
 */
export async function generateWeddingPhotosStream(
  imageUrl: string,
  style: AIStyle,
  role: 'GROOM' | 'BRIDE',
  onImageGenerated: (index: number, url: string) => void,
  modelId?: string
): Promise<{
  urls: string[];
  replicateId: string;
  cost: number;
}> {
  const selectedModelId = modelId || DEFAULT_MODEL;
  const model = Object.values(AI_MODELS).find((m) => m.id === selectedModelId);

  if (!model) {
    throw new Error(`Unknown model: ${selectedModelId}`);
  }

  const basePrompt = STYLE_PROMPTS[style];
  const genderPrompt =
    role === 'GROOM'
      ? 'handsome Korean groom in elegant black tuxedo and bow tie'
      : 'beautiful Korean bride in white wedding dress';

  const prompt = `${genderPrompt}, ${basePrompt}`;

  // 모델별 input 파라미터 구성
  const getModelInput = (i: number) => {
    const baseInput = {
      prompt: `${prompt}, keeping the exact same face, identical facial features, preserve the person's face from the reference image, variation ${i + 1}`,
      image: imageUrl,
    };

    switch (model.id) {
      case 'flux-pro':
      case 'flux-dev':
        return {
          ...baseInput,
          aspect_ratio: '3:4',
          output_format: 'png',
          output_quality: 90,
          prompt_strength: 0.85,
        };
      case 'photomaker':
        return {
          ...baseInput,
          num_steps: 20,
          style_strength_ratio: 20,
          input_image: imageUrl,
          style_name: 'Photographic (Default)',
        };
      default:
        return {
          ...baseInput,
          output_format: 'png',
        };
    }
  };

  const urls: string[] = [];
  const predictionIds: string[] = [];

  for (let i = 0; i < AI_CONFIG.BATCH_SIZE; i++) {
    const prediction = await replicate.predictions.create({
      model: model.replicateModel,
      input: getModelInput(i) as any,
    });

    predictionIds.push(prediction.id);

    const completed = await replicate.wait(prediction);
    const output = completed.output as string;

    if (typeof output !== 'string') {
      throw new Error(
        `Unexpected Replicate output format: expected string, got ${typeof output}`
      );
    }

    urls.push(output);

    // 콜백으로 알림
    onImageGenerated(i, output);
  }

  const cost = AI_CONFIG.BATCH_SIZE * model.costPerImage;

  return {
    urls,
    replicateId: predictionIds[0],
    cost,
  };
}
