/**
 * AI 생성용 스타일/역할 프롬프트
 * 프로바이더 무관 - 모든 AI 모델에서 공통으로 사용
 *
 * 단독 인물 사진 전용: 장면/분위기/조명만 묘사, 커플 묘사 없음
 * 역할별 의상은 ROLE_ATTIRE / ROLE_ATTIRE_OVERRIDES에서 관리
 */

export type AIStyle =
  | 'CLASSIC_STUDIO'
  | 'OUTDOOR_GARDEN'
  | 'SUNSET_BEACH'
  | 'TRADITIONAL_HANBOK'
  | 'VINTAGE_CINEMATIC'
  | 'LUXURY_HOTEL'
  | 'CITY_LIFESTYLE'
  | 'ENCHANTED_FOREST'
  | 'BLACK_AND_WHITE'
  | 'MINIMALIST_GALLERY';

/**
 * 장면/분위기/조명만 묘사 — 인물·의상 언급 없음
 */
const STYLE_PROMPTS: Record<AIStyle, string> = {
  CLASSIC_STUDIO:
    'A classic, elegant studio wedding portrait with soft professional studio lighting and subtle cream-colored floral arrangements in a clean minimalist interior.',
  OUTDOOR_GARDEN:
    'A romantic outdoor wedding photo in a lush, blooming garden. Sunlight filters through the green leaves, creating a soft, dreamy atmosphere with many flowers in the background.',
  SUNSET_BEACH:
    'A dramatic wedding photo on a tropical beach during golden hour sunset. The sky is filled with vibrant orange, pink, and purple hues reflecting on the water.',
  TRADITIONAL_HANBOK:
    'A traditional Korean wedding portrait set in an ancient palace courtyard. The background features historical Korean architecture with vibrant Dancheong colors and a stone wall under clear daylight.',
  VINTAGE_CINEMATIC:
    'A vintage, cinematic wedding photograph with a retro film grain look from the 1950s or 60s. The colors are slightly muted and warm, with an old classic car on a cobblestone street in the background.',
  LUXURY_HOTEL:
    'A glamorous and luxurious wedding photo inside a grand hotel ballroom. The background is opulent, featuring large crystal chandeliers, marble columns, and rich architectural details with dramatic, warm lighting.',
  CITY_LIFESTYLE:
    'A candid, lifestyle wedding snapshot in a bustling city street. The background shows city architecture, blurred pedestrians, and taxi cabs. The vibe is energetic and joyful.',
  ENCHANTED_FOREST:
    'A fairytale wedding photo set in a magical, enchanted forest. The lighting is misty and soft with dappled sunbeams. The background is moss-covered trees and soft glowing lights, creating a dreamlike quality.',
  BLACK_AND_WHITE:
    'A timeless black and white wedding portrait with dramatic, high-contrast lighting. The background is simple and dark, highlighting textures and emotion.',
  MINIMALIST_GALLERY:
    'A minimalist, modern wedding photo suitable for an art gallery. The subject is posing artistically against a completely plain, seamless bright white studio wall. No props. The lighting is clean and even.',
};

/**
 * 역할별 기본 의상 묘사
 */
const ROLE_ATTIRE: Record<'GROOM' | 'BRIDE', string> = {
  GROOM: 'A handsome Korean groom wearing an elegant black tuxedo and bow tie',
  BRIDE: 'A beautiful Korean bride wearing a white wedding dress',
};

/**
 * 특수 스타일별 역할 의상 오버라이드
 */
const ROLE_ATTIRE_OVERRIDES: Partial<Record<AIStyle, Record<'GROOM' | 'BRIDE', string>>> = {
  TRADITIONAL_HANBOK: {
    GROOM: 'A handsome Korean groom wearing a traditional Korean wedding Hanbok with intricate embroidery',
    BRIDE: 'A beautiful Korean bride wearing a colorful traditional Korean wedding Hanbok with elaborate embroidery',
  },
  VINTAGE_CINEMATIC: {
    GROOM: 'A handsome Korean groom wearing a retro wool suit in a 1950s style',
    BRIDE: 'A beautiful Korean bride wearing a vintage tea-length dress and a birdcage veil',
  },
  LUXURY_HOTEL: {
    GROOM: 'A handsome Korean groom in a sharp tuxedo standing on a grand staircase',
    BRIDE: 'A beautiful Korean bride in a voluminous ball gown with sparkling details and a tiara',
  },
  OUTDOOR_GARDEN: {
    GROOM: 'A handsome Korean groom wearing a light beige linen suit',
    BRIDE: 'A beautiful Korean bride wearing a flowing bohemian-style wedding dress with floral details',
  },
  SUNSET_BEACH: {
    GROOM: 'A handsome Korean groom in a relaxed white shirt and khaki trousers',
    BRIDE: 'A beautiful Korean bride wearing a simple, elegant beach wedding gown',
  },
  CITY_LIFESTYLE: {
    GROOM: 'A handsome Korean groom wearing modern, chic wedding attire',
    BRIDE: 'A beautiful Korean bride wearing modern, chic wedding attire',
  },
  ENCHANTED_FOREST: {
    GROOM: 'A handsome Korean groom in an elegant dark suit surrounded by nature',
    BRIDE: 'A beautiful Korean bride wearing an ethereal, flowing tulle dress with vine and flower motifs and a floral crown',
  },
  MINIMALIST_GALLERY: {
    GROOM: 'A handsome Korean groom wearing a sleek, contemporary monochrome suit',
    BRIDE: 'A beautiful Korean bride wearing a very modern, structured architectural wedding dress',
  },
};

/**
 * 스타일 + 역할 기반 프롬프트 생성 (단독 인물용)
 */
export function buildPrompt(style: AIStyle, role: 'GROOM' | 'BRIDE'): string {
  const scenePrompt = STYLE_PROMPTS[style];
  const attire = ROLE_ATTIRE_OVERRIDES[style]?.[role] ?? ROLE_ATTIRE[role];
  return `${attire}, ${scenePrompt}`;
}

/**
 * 커플사진 프롬프트: 신랑+신부 동시 묘사
 */
export function buildCouplePrompt(style: AIStyle): string {
  const scene = STYLE_PROMPTS[style];
  const groomAttire = ROLE_ATTIRE_OVERRIDES[style]?.GROOM ?? ROLE_ATTIRE.GROOM;
  const brideAttire = ROLE_ATTIRE_OVERRIDES[style]?.BRIDE ?? ROLE_ATTIRE.BRIDE;
  return `A romantic wedding couple portrait. ${groomAttire} and ${brideAttire}, posing together lovingly. ${scene}`;
}

/**
 * 얼굴 보존 지시 포함 프롬프트 생성 (단독 인물용)
 */
export function buildPromptWithFacePreservation(
  style: AIStyle,
  role: 'GROOM' | 'BRIDE',
  variationIndex: number,
): string {
  const base = buildPrompt(style, role);
  return `${base}, keeping the exact same face, identical facial features, preserve the person's face from the reference image, variation ${variationIndex + 1}`;
}

/**
 * 커플사진 얼굴 보존 프롬프트
 */
export function buildCouplePromptWithFacePreservation(
  style: AIStyle,
  variationIndex: number,
): string {
  const base = buildCouplePrompt(style);
  return `${base}, keeping the exact same faces from the two reference images, identical facial features for both people, variation ${variationIndex + 1}`;
}
