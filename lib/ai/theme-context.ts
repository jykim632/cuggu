/**
 * 청첩장 데이터에서 AI 테마 생성에 유용한 컨텍스트만 추출.
 * 개인정보(이름, 연락처, 계좌, 주소, 좌표, 인사말 원문)는 절대 포함하지 않음.
 */

// ── 타입 ──

export interface ThemeContextSource {
  weddingDate?: Date | string | null;
  venueName?: string | null;
  introMessage?: string | null;
  galleryImages?: string[] | null;
}

export interface ThemeContextResult {
  season: string | null;
  venueType: string | null;
  galleryScale: string | null;
  greetingTone: string | null;
}

// ── 계절 추출 ──

function extractSeason(weddingDate: Date | string | null | undefined): string | null {
  if (!weddingDate) return null;
  const date = typeof weddingDate === 'string' ? new Date(weddingDate) : weddingDate;
  if (isNaN(date.getTime())) return null;

  const month = date.getMonth() + 1; // 0-indexed → 1-indexed
  if (month >= 3 && month <= 5) return '봄';
  if (month >= 6 && month <= 8) return '여름';
  if (month >= 9 && month <= 11) return '가을';
  return '겨울';
}

// ── 장소 유형 추출 ──

const VENUE_KEYWORDS: [string[], string][] = [
  [['호텔', '그랜드', '파르나스', '웨스틴', '힐튼', '조선', '신라', '인터컨티넨탈', '메리어트'], '호텔 웨딩'],
  [['가든', '정원', '야외', '숲', '잔디'], '가든/야외 웨딩'],
  [['교회', '성당', '채플'], '교회/성당 웨딩'],
  [['한옥', '전통'], '한옥/전통 웨딩'],
  [['홀', '컨벤션', '웨딩홀', '예식장', '아트홀'], '웨딩홀'],
];

function extractVenueType(venueName: string | null | undefined): string | null {
  if (!venueName) return null;
  const name = venueName.toLowerCase();
  for (const [keywords, type] of VENUE_KEYWORDS) {
    if (keywords.some((kw) => name.includes(kw))) return type;
  }
  return null;
}

// ── 갤러리 규모 ──

function extractGalleryScale(galleryImages: string[] | null | undefined): string | null {
  if (!galleryImages || galleryImages.length < 10) return null;
  return `갤러리 사진 ${galleryImages.length}장`;
}

// ── 인사말 톤 ──

const FORMAL_KEYWORDS = ['삼가', '경하', '축복', '소중한 분들을', '화촉', '백년가약', '두 사람', '평생'];

function extractGreetingTone(introMessage: string | null | undefined): string | null {
  if (!introMessage || introMessage.length < 10) return null;
  const isFormal = FORMAL_KEYWORDS.some((kw) => introMessage.includes(kw));
  return isFormal ? '격식체' : '캐주얼';
}

// ── 공개 API ──

export function extractThemeContext(source: ThemeContextSource): ThemeContextResult {
  return {
    season: extractSeason(source.weddingDate),
    venueType: extractVenueType(source.venueName),
    galleryScale: extractGalleryScale(source.galleryImages),
    greetingTone: extractGreetingTone(source.introMessage),
  };
}

export function buildContextPrompt(ctx: ThemeContextResult): string {
  const parts: string[] = [];

  if (ctx.season) parts.push(`계절: ${ctx.season}`);
  if (ctx.venueType) parts.push(`장소 유형: ${ctx.venueType}`);
  if (ctx.galleryScale) parts.push(`사진 규모가 큰 편 (${ctx.galleryScale})`);
  if (ctx.greetingTone) parts.push(`인사말 톤: ${ctx.greetingTone}`);

  if (parts.length === 0) return '';

  return `\n\n[참고 - 이 청첩장의 예식 정보]\n${parts.join('\n')}`;
}

/**
 * 클라이언트용: 빠진 항목 체크를 위한 상태 정보
 */
export interface ContextCheckItem {
  label: string;
  filled: boolean;
  detail: string;
}

export function checkContextItems(source: ThemeContextSource): ContextCheckItem[] {
  const season = extractSeason(source.weddingDate);
  const date = source.weddingDate
    ? (typeof source.weddingDate === 'string' ? new Date(source.weddingDate) : source.weddingDate)
    : null;
  const month = date && !isNaN(date.getTime()) ? date.getMonth() + 1 : null;
  const year = date && !isNaN(date.getTime()) ? date.getFullYear() : null;

  return [
    {
      label: '예식일',
      filled: !!season,
      detail: season && year && month ? `${year}년 ${month}월 (${season})` : '미입력',
    },
    {
      label: '예식 장소',
      filled: !!extractVenueType(source.venueName),
      detail: extractVenueType(source.venueName) || (source.venueName ? `${source.venueName} (유형 미매칭)` : '미입력'),
    },
    {
      label: '갤러리 사진',
      filled: !!extractGalleryScale(source.galleryImages),
      detail: source.galleryImages?.length
        ? `${source.galleryImages.length}장`
        : '미입력',
    },
    {
      label: '인사말',
      filled: !!extractGreetingTone(source.introMessage),
      detail: extractGreetingTone(source.introMessage)
        ? `${extractGreetingTone(source.introMessage)} 톤 감지`
        : '미입력',
    },
  ];
}
