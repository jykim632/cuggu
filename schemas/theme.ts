import { z } from 'zod';

// ── Config 스키마들 ──

export const DividerConfigSchema = z.object({
  type: z.enum(['none', 'horizontal-line', 'vertical-line', 'gradient-line']),
  color: z.string().optional(),
  size: z.string().optional(),
  className: z.string().optional(),
});

export const DecorationConfigSchema = z.object({
  type: z.enum(['none', 'emoji', 'symbol-with-lines', 'diamond-with-lines', 'text-label']),
  emoji: z.string().optional(),
  symbol: z.string().optional(),
  text: z.string().optional(),
  lineColor: z.string().optional(),
  lineSize: z.string().optional(),
  symbolClass: z.string().optional(),
  className: z.string().optional(),
});

export const HeadingConfigSchema = z.object({
  type: z.enum(['default', 'with-decoration', 'with-sub-label', 'text-label']),
  decoration: z.string().optional(),
  decorationClass: z.string().optional(),
  subLabel: z.string().optional(),
  subLabelClass: z.string().optional(),
  headingClass: z.string().optional(),
  className: z.string().optional(),
  lineColor: z.string().optional(),
  lineSize: z.string().optional(),
});

export const AnimationConfigSchema = z.object({
  preset: z.enum(['fade', 'slide-x-left', 'slide-x-right', 'slide-y', 'scale', 'fade-scale']),
  delay: z.number().optional(),
  duration: z.number().optional(),
  staggerDelay: z.number().optional(),
});

export const CoverConfigSchema = z.object({
  layout: z.enum(['center', 'bottom-left']),
  fallbackBg: z.string().optional(),
  imageOverlay: z.string().optional(),
  imageClass: z.string().optional(),
  topDecoration: DecorationConfigSchema.optional(),
  bottomDecoration: DecorationConfigSchema.optional(),
  labelClass: z.string().optional(),
  labelText: z.string().optional(),
  nameWrapperClass: z.string().optional(),
  nameClass: z.string().optional(),
  ampersandClass: z.string().optional(),
  nameDivider: z.enum(['ampersand', 'lines-only', 'lines-with-ampersand']).optional(),
  nameDividerLineClass: z.string().optional(),
  dateClass: z.string().optional(),
  venueClass: z.string().optional(),
  animation: AnimationConfigSchema.optional(),
  motionClass: z.string().optional(),
});

export const FooterConfigSchema = z.object({
  layout: z.enum(['centered', 'flex-between']),
  topDivider: DividerConfigSchema.optional(),
  topDecoration: DecorationConfigSchema.optional(),
  containerClass: z.string().optional(),
  nameClass: z.string().optional(),
  linkClass: z.string().optional(),
});

// ── SerializableTheme 스키마 ──

export const SerializableThemeSchema = z.object({
  id: z.string(),

  // 컨테이너
  containerBg: z.string(),

  // 섹션 공통
  sectionPadding: z.string(),
  contentMaxWidth: z.string(),
  galleryMaxWidth: z.string(),

  // 타이포그래피
  headingClass: z.string(),
  bodyText: z.string(),
  nameClass: z.string(),
  labelClass: z.string(),

  // 카드
  cardClass: z.string(),
  accountCardClass: z.string(),

  // 색상
  iconColor: z.string(),
  accentColor: z.string(),
  sideLabel: z.string(),
  phoneLinkClass: z.string(),
  accountTypeLabel: z.string(),
  accountName: z.string(),
  accountDetail: z.string(),
  accountHolder: z.string(),

  // 배경
  noticeBg: z.string(),
  mapInfoBg: z.string(),
  transportCard: z.string(),

  // 섹션별 배경
  sectionBg: z.record(z.string(), z.string()).optional().default({}),

  // 인사말
  greetingDecorTop: DecorationConfigSchema.optional(),
  greetingDecorBottom: DecorationConfigSchema.optional(),
  greetingMaxWidth: z.string(),
  greetingAlign: z.string(),

  // 갤러리
  galleryGap: z.string(),
  galleryItemClass: z.string(),
  galleryHover: z.string(),
  galleryItemAnimation: AnimationConfigSchema,

  // 부모 섹션
  parentsGrid: z.string(),
  parentsCardWrapper: z.string().optional(),
  parentsHeading: HeadingConfigSchema.optional(),
  parentsRoleLabel: z.boolean().optional(),
  parentsFamilyNameClass: z.string().optional(),
  groomAnimation: AnimationConfigSchema,
  brideAnimation: AnimationConfigSchema,

  // 계좌
  accountsSpacing: z.string(),
  accountCardsSpacing: z.string(),
  accountsDivider: DividerConfigSchema.optional(),

  // 카드 내부 텍스트
  cardLabelClass: z.string(),
  cardValueClass: z.string(),
  cardSubTextClass: z.string(),
  noticeTextClass: z.string(),
  transportLabelClass: z.string(),
  transportTextClass: z.string(),

  // 예식 정보
  ceremonyCentered: z.boolean().optional(),
  ceremonyHeading: HeadingConfigSchema.optional(),
  ceremonyDateLabel: z.string().optional(),
  ceremonyVenueLabel: z.string().optional(),
  ceremonyNoticeDivider: DividerConfigSchema.optional(),

  // 지도
  mapVenueNameClass: z.string(),
  mapAddressClass: z.string(),
  mapShowTel: z.boolean().optional(),
  transportTopDivider: DividerConfigSchema.optional(),

  // 디바이더
  sectionDivider: DividerConfigSchema.optional(),
  postCoverDivider: DividerConfigSchema.optional(),

  // 커스텀 헤딩
  mapHeading: HeadingConfigSchema.optional(),
  galleryHeading: HeadingConfigSchema.optional(),
  accountsHeading: HeadingConfigSchema.optional(),

  // D-Day 달력
  calendarAccentColor: z.string().optional(),
  calendarTodayColor: z.string().optional(),
  calendarHeaderClass: z.string().optional(),
  calendarDayClass: z.string().optional(),
  countdownNumberClass: z.string().optional(),
  countdownLabelClass: z.string().optional(),
  countdownUnitClass: z.string().optional(),

  // 커버/푸터
  cover: CoverConfigSchema,
  footer: FooterConfigSchema,
});

export type SerializableThemeZod = z.infer<typeof SerializableThemeSchema>;
