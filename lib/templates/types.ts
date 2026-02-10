// ── SerializableTheme 타입 시스템 ──
// 모든 필드가 JSON-serializable (ReactNode/함수 없음)

// ── Config 타입들 ──

export interface DividerConfig {
  type: 'none' | 'horizontal-line' | 'vertical-line' | 'gradient-line';
  /** Tailwind 색상 클래스 (e.g., 'bg-stone-200', 'from-transparent via-emerald-500/40 to-transparent') */
  color?: string;
  /** Tailwind 크기 (e.g., 'w-8', 'h-12', 'w-full') */
  size?: string;
  /** 추가 Tailwind 클래스 */
  className?: string;
}

export interface DecorationConfig {
  type: 'none' | 'emoji' | 'symbol-with-lines' | 'diamond-with-lines' | 'text-label';
  /** emoji type일 때 이모지 문자 */
  emoji?: string;
  /** symbol-with-lines일 때 심볼 (HTML entity 코드 등) */
  symbol?: string;
  /** text-label일 때 텍스트 */
  text?: string;
  /** Tailwind line 색상 */
  lineColor?: string;
  /** Tailwind line 크기 */
  lineSize?: string;
  /** 심볼/이모지 Tailwind 클래스 */
  symbolClass?: string;
  /** 컨테이너 Tailwind 클래스 */
  className?: string;
}

export interface HeadingConfig {
  type: 'default' | 'with-decoration' | 'with-sub-label' | 'text-label';
  /** with-decoration일 때 장식 이모지/심볼 */
  decoration?: string;
  /** with-decoration일 때 장식 Tailwind 클래스 */
  decorationClass?: string;
  /** with-sub-label일 때 상단 소라벨 */
  subLabel?: string;
  /** with-sub-label일 때 라벨 Tailwind 클래스 */
  subLabelClass?: string;
  /** 헤딩 텍스트 Tailwind 클래스 */
  headingClass?: string;
  /** text-label일 때 전체 컨테이너 클래스 */
  className?: string;
  /** with-decoration 라인 색상 */
  lineColor?: string;
  /** with-decoration 라인 크기 */
  lineSize?: string;
}

export type AnimationPreset =
  | 'fade'
  | 'slide-x-left'
  | 'slide-x-right'
  | 'slide-y'
  | 'scale'
  | 'fade-scale';

export interface AnimationConfig {
  preset: AnimationPreset;
  /** 딜레이 (기본: 0) */
  delay?: number;
  /** 트랜지션 duration */
  duration?: number;
  /** stagger 인덱스 기반 딜레이 간격 (galleryItemAnimation용) */
  staggerDelay?: number;
}

export interface CoverConfig {
  layout: 'center' | 'bottom-left';

  // ── 배경 ──
  /** 커버 이미지 없을 때 대체 배경 (e.g., 'bg-gradient-to-br from-zinc-800 to-zinc-900') */
  fallbackBg?: string;
  /** 이미지 위 그라데이션 오버레이 */
  imageOverlay?: string;
  /** 이미지 추가 클래스 (opacity, grayscale 등) */
  imageClass?: string;

  // ── 상단 장식 ──
  topDecoration?: DecorationConfig;
  /** 하단 장식 */
  bottomDecoration?: DecorationConfig;

  // ── "Wedding Invitation" 라벨 ──
  labelClass?: string;
  labelText?: string;

  // ── 이름 영역 ──
  /** 이름 카드/래퍼 클래스 (Floral의 glassmorphism 카드 등) */
  nameWrapperClass?: string;
  nameClass?: string;
  /** 앰퍼샌드 스타일 */
  ampersandClass?: string;
  /** 이름 사이 구분자 (Minimal: 양쪽 라인, Modern: emerald 라인 + &, 기본: & 텍스트) */
  nameDivider?: 'ampersand' | 'lines-only' | 'lines-with-ampersand';
  /** 라인 색상/클래스 */
  nameDividerLineClass?: string;

  // ── 날짜/장소 ──
  dateClass?: string;
  venueClass?: string;

  // ── 애니메이션 ──
  animation?: AnimationConfig;

  // ── 모션 wrapper 추가 클래스 ──
  motionClass?: string;
}

export interface FooterConfig {
  layout: 'centered' | 'flex-between';

  /** 상단 구분선 (단순 라인) */
  topDivider?: DividerConfig;
  /** 상단 장식 (이모지/심볼/다이아몬드 등) */
  topDecoration?: DecorationConfig;

  /** 컨테이너 클래스 */
  containerClass?: string;
  /** 이름 텍스트 클래스 */
  nameClass?: string;
  /** Cuggu 링크 클래스 */
  linkClass?: string;
}

// ── SerializableTheme (TemplateTheme 대체) ──

export interface SerializableTheme {
  id: string;

  // ── 컨테이너 ──
  containerBg: string;

  // ── 섹션 공통 ──
  sectionPadding: string;
  contentMaxWidth: string;
  galleryMaxWidth: string;

  // ── 타이포그래피 ──
  headingClass: string;
  bodyText: string;
  nameClass: string;
  labelClass: string;

  // ── 카드 ──
  cardClass: string;
  accountCardClass: string;

  // ── 색상 ──
  iconColor: string;
  accentColor: string;
  sideLabel: string;
  phoneLinkClass: string;
  accountTypeLabel: string;
  accountName: string;
  accountDetail: string;
  accountHolder: string;

  // ── 배경 ──
  noticeBg: string;
  mapInfoBg: string;
  transportCard: string;

  // ── 섹션별 배경 (선택적) ──
  sectionBg: Partial<Record<string, string>>;

  // ── 인사말 ──
  greetingDecorTop?: DecorationConfig;
  greetingDecorBottom?: DecorationConfig;
  greetingMaxWidth: string;
  greetingAlign: string;

  // ── 갤러리 ──
  galleryGap: string;
  galleryItemClass: string;
  galleryHover: string;
  galleryItemAnimation: AnimationConfig;

  // ── 부모 섹션 ──
  parentsGrid: string;
  parentsCardWrapper?: string;
  parentsHeading?: HeadingConfig;
  parentsRoleLabel?: boolean;
  parentsFamilyNameClass?: string;
  groomAnimation: AnimationConfig;
  brideAnimation: AnimationConfig;

  // ── 계좌 ──
  accountsSpacing: string;
  accountCardsSpacing: string;
  accountsDivider?: DividerConfig;

  // ── 카드 내부 텍스트 ──
  cardLabelClass: string;
  cardValueClass: string;
  cardSubTextClass: string;
  noticeTextClass: string;
  transportLabelClass: string;
  transportTextClass: string;

  // ── 레이아웃 다양성 ──
  galleryLayout?: 'grid-2' | 'grid-3' | 'grid-2-1' | 'single-column' | 'masonry';
  parentsLayout?: 'side-by-side' | 'stacked' | 'compact' | 'cards';
  parentsFullHeight?: boolean;
  greetingLayout?: 'centered' | 'left-aligned' | 'quote-style';
  ceremonyLayout?: 'cards' | 'centered' | 'inline' | 'timeline';
  sectionSpacing?: 'compact' | 'normal' | 'spacious';

  // ── 예식 정보 ──
  ceremonyCentered?: boolean;
  ceremonyHeading?: HeadingConfig;
  ceremonyDateLabel?: string;
  ceremonyVenueLabel?: string;
  /** Minimal ceremony notice 위 구분선 */
  ceremonyNoticeDivider?: DividerConfig;

  // ── 지도 내 텍스트 ──
  mapVenueNameClass: string;
  mapAddressClass: string;
  /** Classic: 지도 섹션 전화번호 표시 */
  mapShowTel?: boolean;
  /** Minimal: 교통편 위 구분선 */
  transportTopDivider?: DividerConfig;

  // ── 디바이더 ──
  sectionDivider?: DividerConfig;
  postCoverDivider?: DividerConfig;

  // ── 커스텀 헤딩 ──
  mapHeading?: HeadingConfig;
  galleryHeading?: HeadingConfig;
  accountsHeading?: HeadingConfig;

  // ── D-Day 달력 ──
  calendarAccentColor?: string;
  calendarTodayColor?: string;
  calendarHeaderClass?: string;
  calendarDayClass?: string;
  countdownNumberClass?: string;
  countdownLabelClass?: string;
  countdownUnitClass?: string;

  // ── RSVP 폼 ──
  rsvpInputClass?: string;
  rsvpActiveClass?: string;
  rsvpInactiveClass?: string;
  rsvpSubmitClass?: string;

  // ── 커버/푸터 ──
  cover: CoverConfig;
  footer: FooterConfig;
}
