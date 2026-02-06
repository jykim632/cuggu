import type { ReactNode } from 'react';

// ── TemplateTheme 타입 정의 ──

export interface TemplateTheme {
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
  greetingDecorTop?: ReactNode;
  greetingDecorBottom?: ReactNode;
  greetingMaxWidth: string;
  greetingAlign: string; // 'text-center' or '' (Modern: left-aligned)

  // ── 갤러리 ──
  galleryGap: string;
  galleryItemClass: string;
  galleryHover: string;
  galleryItemMotion: (index: number) => object;

  // ── 부모 섹션 ──
  parentsGrid: string;
  parentsCardWrapper?: string;
  parentsHeading?: ReactNode;
  parentsRoleLabel?: boolean;   // "Groom"/"Bride" 상단 라벨 표시 여부
  parentsFamilyNameClass?: string; // parentsRoleLabel=true일 때 가족 관계 텍스트 스타일
  groomMotion: object;
  brideMotion: object;

  // ── 계좌 ──
  accountsSpacing: string;
  accountCardsSpacing: string;
  accountsDivider?: ReactNode;  // 신랑/신부 사이 구분선 (Minimal)

  // ── 카드 내부 텍스트 ──
  cardLabelClass: string;       // 카드 내 소제목 ("예식 일시" 등)
  cardValueClass: string;       // 카드 내 값 (날짜 텍스트 등)
  cardSubTextClass: string;     // 카드 내 보조 텍스트 (주소 등)
  noticeTextClass: string;      // 안내사항 텍스트
  transportLabelClass: string;  // 교통편 제목
  transportTextClass: string;   // 교통편 본문

  // ── 예식 정보 ──
  ceremonyCentered?: boolean;
  ceremonyHeading?: ReactNode;
  ceremonyDateLabel?: string;
  ceremonyVenueLabel?: string;

  // ── 지도 내 텍스트 ──
  mapVenueNameClass: string;
  mapAddressClass: string;

  // ── 디바이더 ──
  sectionDivider?: ReactNode;
  postCoverDivider?: ReactNode;

  // ── 커스텀 헤딩 (ReactNode 주입) ──
  mapHeading?: ReactNode;
  galleryHeading?: ReactNode;
  accountsHeading?: ReactNode;
}

// ── 헬퍼: 테마별 장식 컴포넌트 ──

function FloralDecor() {
  return (
    <div className="flex items-center justify-center gap-3">
      <div className="h-px w-12 bg-gradient-to-r from-transparent to-rose-200" />
      <span className="text-rose-300 text-lg">&#x2740;</span>
      <div className="h-px w-12 bg-gradient-to-l from-transparent to-rose-200" />
    </div>
  );
}

function ElegantDiamondDecor() {
  return (
    <div className="flex items-center justify-center gap-4">
      <div className="h-px w-16 bg-gradient-to-r from-transparent to-amber-400/60" />
      <div className="w-2 h-2 rotate-45 border border-amber-400/60" />
      <div className="h-px w-16 bg-gradient-to-l from-transparent to-amber-400/60" />
    </div>
  );
}

function NaturalLeafDecor() {
  return (
    <div className="flex items-center justify-center gap-2">
      <span className="text-xl opacity-60">&#x1F33F;</span>
    </div>
  );
}

function NaturalLeafHeading({ children }: { children: ReactNode }) {
  return (
    <div className="text-center mb-10">
      <span className="text-2xl opacity-60">&#x1F33F;</span>
      <h2 className="text-xl md:text-2xl font-light text-stone-800 mt-2">{children}</h2>
    </div>
  );
}

function ElegantSubLabelHeading({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="text-center mb-10">
      <p className="text-xs tracking-[0.3em] text-amber-500 uppercase mb-2">{label}</p>
      <h2 className="text-xl md:text-2xl font-serif text-slate-800">{children}</h2>
    </div>
  );
}

function FloralLineHeading({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-8">
      <div className="h-px w-12 bg-gradient-to-r from-transparent to-rose-200" />
      <h2 className="font-serif text-xl text-rose-800">{children}</h2>
      <div className="h-px w-12 bg-gradient-to-l from-transparent to-rose-200" />
    </div>
  );
}

// ── 6개 테마 정의 ──

export const classicTheme: TemplateTheme = {
  id: 'classic',
  containerBg: 'min-h-screen bg-gradient-to-b from-amber-50 via-white to-amber-50',
  sectionPadding: 'py-12 md:py-20 px-6',
  contentMaxWidth: 'max-w-2xl mx-auto',
  galleryMaxWidth: 'max-w-4xl mx-auto',
  headingClass: 'text-xl md:text-2xl font-serif text-center text-gray-800 mb-8 md:mb-12',
  bodyText: 'text-sm md:text-base text-gray-700 leading-relaxed whitespace-pre-line',
  nameClass: 'text-2xl md:text-3xl font-serif text-gray-800 mb-3 md:mb-4',
  labelClass: 'text-xs md:text-sm text-amber-800 mb-3 md:mb-4 font-medium',
  cardClass: 'flex items-start gap-3 md:gap-4 p-4 md:p-6 bg-white rounded-lg shadow-sm border border-amber-100',
  accountCardClass: 'p-4 md:p-5 bg-white rounded-xl shadow-sm border border-amber-100',
  iconColor: 'text-amber-600',
  accentColor: 'text-amber-600 hover:text-amber-700',
  sideLabel: 'text-sm md:text-base text-amber-800 mb-3 font-semibold',
  phoneLinkClass: 'inline-flex items-center gap-2 text-sm text-gray-600 hover:text-amber-600 transition-colors py-2 px-3 -mx-3 min-h-[44px]',
  accountTypeLabel: 'text-xs text-slate-500 mb-2',
  accountName: 'text-sm md:text-base text-gray-800 font-medium mb-1',
  accountDetail: 'text-xs md:text-sm text-gray-600',
  accountHolder: 'text-xs text-gray-500',
  noticeBg: 'p-4 md:p-6 bg-amber-50 rounded-lg',
  mapInfoBg: 'mt-4 p-4 bg-amber-50/60 rounded-lg',
  transportCard: 'mt-4 p-4 bg-white rounded-lg border border-amber-100',
  sectionBg: { parents: 'bg-amber-50/30', gallery: 'bg-amber-50/30', rsvp: 'bg-amber-50/30' },
  greetingDecorTop: <div className="text-3xl md:text-4xl mb-6 md:mb-8">🌸</div>,
  greetingDecorBottom: undefined,
  greetingMaxWidth: 'max-w-2xl w-full',
  greetingAlign: 'text-center',
  galleryGap: 'gap-3 md:gap-4',
  galleryItemClass: 'aspect-square overflow-hidden rounded-lg shadow-md cursor-pointer',
  galleryHover: 'hover:scale-110 transition-transform duration-300',
  galleryItemMotion: (i) => ({ initial: { opacity: 0, scale: 0.9 }, whileInView: { opacity: 1, scale: 1 }, transition: { delay: i * 0.1 } }),
  parentsGrid: 'grid md:grid-cols-2 gap-8 md:gap-12',
  groomMotion: { initial: { opacity: 0, x: -20 }, whileInView: { opacity: 1, x: 0 } },
  brideMotion: { initial: { opacity: 0, x: 20 }, whileInView: { opacity: 1, x: 0 } },
  accountsSpacing: 'space-y-6 md:space-y-8',
  accountCardsSpacing: 'space-y-3',
  cardLabelClass: 'font-medium text-sm md:text-base text-gray-800 mb-1 md:mb-2',
  cardValueClass: 'text-sm md:text-base text-gray-600',
  cardSubTextClass: 'text-xs md:text-sm text-gray-600',
  noticeTextClass: 'text-xs md:text-sm text-gray-600 whitespace-pre-line leading-relaxed',
  transportLabelClass: 'text-xs font-semibold text-gray-700 mb-2',
  transportTextClass: 'text-xs text-gray-600 leading-relaxed whitespace-pre-line',
  ceremonyDateLabel: '예식 일시',
  ceremonyVenueLabel: '예식 장소',
  mapVenueNameClass: 'text-sm font-medium text-gray-800',
  mapAddressClass: 'text-xs text-gray-600 mt-1',
  sectionDivider: undefined,
  postCoverDivider: undefined,
};

export const modernTheme: TemplateTheme = {
  id: 'modern',
  containerBg: 'min-h-screen bg-zinc-50',
  sectionPadding: 'py-16 md:py-24 px-8 md:px-12',
  contentMaxWidth: 'max-w-2xl',
  galleryMaxWidth: 'max-w-4xl',
  headingClass: 'text-xs tracking-[0.3em] text-emerald-600 uppercase mb-6',
  bodyText: 'text-base md:text-lg text-zinc-600 leading-relaxed whitespace-pre-line',
  nameClass: 'text-2xl md:text-3xl font-bold text-zinc-900 mb-3',
  labelClass: 'text-xs text-zinc-400 mb-2',
  cardClass: 'flex items-start gap-4',
  accountCardClass: 'py-4 border-b border-zinc-200',
  iconColor: 'text-emerald-500',
  accentColor: 'text-emerald-600 hover:text-emerald-700',
  sideLabel: 'text-sm font-semibold text-zinc-800 mb-4',
  phoneLinkClass: 'inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-emerald-600 transition-colors py-2 min-h-[44px]',
  accountTypeLabel: 'text-xs text-zinc-400 mb-1',
  accountName: 'text-sm text-zinc-800 font-medium',
  accountDetail: 'text-sm text-zinc-500 mt-1',
  accountHolder: 'text-xs text-zinc-400 mt-0.5',
  noticeBg: 'border-l-2 border-emerald-400 pl-4',
  mapInfoBg: 'mt-6 space-y-2',
  transportCard: 'mt-6 p-4 bg-zinc-100 rounded-lg',
  sectionBg: { gallery: 'bg-zinc-100' },
  greetingDecorTop: <p className="text-xs tracking-[0.3em] text-emerald-600 uppercase mb-6">Greeting</p>,
  greetingDecorBottom: undefined,
  greetingMaxWidth: 'max-w-2xl w-full',
  greetingAlign: '',
  galleryGap: 'gap-2',
  galleryItemClass: 'aspect-square overflow-hidden cursor-pointer',
  galleryHover: 'hover:scale-105 transition-transform duration-500',
  galleryItemMotion: (i) => ({ initial: { opacity: 0, scale: 0.95 }, whileInView: { opacity: 1, scale: 1 }, transition: { delay: i * 0.08 } }),
  parentsGrid: 'grid md:grid-cols-2 gap-12',
  parentsHeading: <p className="text-xs tracking-[0.3em] text-emerald-600 uppercase mb-10">Bride &amp; Groom</p>,
  groomMotion: { initial: { opacity: 0, x: -20 }, whileInView: { opacity: 1, x: 0 }, transition: { duration: 0.5 } },
  brideMotion: { initial: { opacity: 0, x: 20 }, whileInView: { opacity: 1, x: 0 }, transition: { duration: 0.5 } },
  accountsSpacing: 'space-y-8',
  accountCardsSpacing: 'space-y-3',
  cardLabelClass: 'text-xs text-zinc-400 uppercase tracking-wide mb-1',
  cardValueClass: 'text-base text-zinc-800',
  cardSubTextClass: 'text-sm text-zinc-500',
  noticeTextClass: 'text-sm text-zinc-500 whitespace-pre-line leading-relaxed',
  transportLabelClass: 'text-xs font-semibold text-zinc-700 mb-2',
  transportTextClass: 'text-sm text-zinc-600 whitespace-pre-line leading-relaxed',
  ceremonyHeading: <p className="text-xs tracking-[0.3em] text-emerald-600 uppercase mb-6">Ceremony</p>,
  ceremonyDateLabel: 'Date & Time',
  ceremonyVenueLabel: 'Location',
  mapVenueNameClass: 'text-base font-medium text-zinc-800',
  mapAddressClass: 'text-sm text-zinc-500',
  sectionDivider: <div className="h-px bg-zinc-200 mx-8 md:mx-12" />,
  postCoverDivider: <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />,
  galleryHeading: <p className="text-xs tracking-[0.3em] text-emerald-600 uppercase mb-10">Gallery</p>,
  accountsHeading: <p className="text-xs tracking-[0.3em] text-emerald-600 uppercase mb-10">Account</p>,
  mapHeading: <p className="text-xs tracking-[0.3em] text-emerald-600 uppercase mb-6">Location</p>,
};

export const minimalTheme: TemplateTheme = {
  id: 'minimal',
  containerBg: 'min-h-screen bg-white',
  sectionPadding: 'py-16 md:py-24 px-6',
  contentMaxWidth: 'max-w-md mx-auto',
  galleryMaxWidth: 'max-w-3xl mx-auto',
  headingClass: 'text-[10px] tracking-[0.3em] text-stone-400 uppercase text-center mb-8',
  bodyText: 'text-sm md:text-base text-stone-500 leading-loose whitespace-pre-line tracking-wide font-light',
  nameClass: 'text-xl font-light tracking-[0.1em] text-stone-900 mb-3',
  labelClass: 'text-[10px] tracking-[0.3em] text-stone-400 uppercase mb-4',
  cardClass: 'text-center',
  accountCardClass: 'py-3',
  iconColor: 'text-stone-300',
  accentColor: 'text-stone-400 hover:text-stone-600',
  sideLabel: 'text-xs font-medium text-stone-700 mb-4 tracking-wide',
  phoneLinkClass: 'inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors py-2 min-h-[44px]',
  accountTypeLabel: 'text-[10px] text-stone-400 mb-1',
  accountName: 'text-xs text-stone-700',
  accountDetail: 'text-xs text-stone-400 mt-1',
  accountHolder: 'text-[10px] text-stone-300 mt-0.5',
  noticeBg: 'pt-6',
  mapInfoBg: 'mt-6 space-y-1',
  transportCard: 'mt-6 pt-6',
  sectionBg: {},
  greetingDecorTop: undefined,
  greetingDecorBottom: undefined,
  greetingMaxWidth: 'max-w-md w-full',
  greetingAlign: 'text-center',
  galleryGap: 'gap-1',
  galleryItemClass: 'aspect-square overflow-hidden cursor-pointer',
  galleryHover: 'hover:opacity-80 transition-opacity duration-300',
  galleryItemMotion: (i) => ({ initial: { opacity: 0 }, whileInView: { opacity: 1 }, transition: { delay: i * 0.05 } }),
  parentsGrid: 'grid grid-cols-2 gap-12',
  parentsRoleLabel: true,
  parentsFamilyNameClass: 'text-xs text-stone-400 mb-2',
  groomMotion: { initial: { opacity: 0 }, whileInView: { opacity: 1 }, transition: { duration: 0.6 } },
  brideMotion: { initial: { opacity: 0 }, whileInView: { opacity: 1 }, transition: { duration: 0.6, delay: 0.1 } },
  accountsSpacing: 'space-y-10',
  accountCardsSpacing: 'space-y-4',
  accountsDivider: <div className="h-px w-8 bg-stone-200 mx-auto" />,
  cardLabelClass: '',
  cardValueClass: 'text-sm text-stone-700 tracking-wide',
  cardSubTextClass: 'text-xs text-stone-400 tracking-wide',
  noticeTextClass: 'text-xs text-stone-400 whitespace-pre-line leading-relaxed tracking-wide',
  transportLabelClass: '',
  transportTextClass: 'text-xs text-stone-400 whitespace-pre-line leading-relaxed tracking-wide',
  ceremonyCentered: true,
  ceremonyDateLabel: 'Date & Time',
  ceremonyVenueLabel: 'Location',
  mapVenueNameClass: 'text-sm text-stone-800 font-medium tracking-wide',
  mapAddressClass: 'text-xs text-stone-400 tracking-wide',
  sectionDivider: <div className="flex justify-center py-4"><div className="h-12 w-px bg-stone-200" /></div>,
  postCoverDivider: <div className="flex justify-center py-4"><div className="h-12 w-px bg-stone-200" /></div>,
  galleryHeading: <p className="text-[10px] tracking-[0.3em] text-stone-400 uppercase text-center mb-12">Gallery</p>,
  accountsHeading: <p className="text-[10px] tracking-[0.3em] text-stone-400 uppercase mb-12">Account</p>,
  mapHeading: <p className="text-[10px] tracking-[0.3em] text-stone-400 uppercase mb-8">오시는 길</p>,
};

export const floralTheme: TemplateTheme = {
  id: 'floral',
  containerBg: 'min-h-screen bg-gradient-to-b from-rose-50 via-pink-50/30 to-rose-50',
  sectionPadding: 'py-14 md:py-20 px-6',
  contentMaxWidth: 'max-w-lg mx-auto',
  galleryMaxWidth: 'max-w-4xl mx-auto',
  headingClass: 'font-serif text-xl text-center text-rose-800 mb-10',
  bodyText: 'font-serif text-sm md:text-base text-rose-800/70 leading-relaxed whitespace-pre-line',
  nameClass: 'font-serif text-2xl text-rose-900 mb-3',
  labelClass: 'text-xs text-rose-400 mb-3',
  cardClass: 'flex items-start gap-4 p-5 bg-white/60 rounded-2xl border border-rose-100',
  accountCardClass: 'p-4 bg-white/60 rounded-2xl border border-rose-100 text-center',
  iconColor: 'text-rose-400',
  accentColor: 'text-rose-400 hover:text-rose-600',
  sideLabel: 'text-sm text-rose-600 mb-3 font-semibold text-center',
  phoneLinkClass: 'inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-600 transition-colors py-2 min-h-[44px]',
  accountTypeLabel: 'text-[10px] text-rose-400 mb-1',
  accountName: 'text-sm text-rose-900 font-medium',
  accountDetail: 'text-xs text-rose-500/70 mt-1',
  accountHolder: 'text-[10px] text-rose-400 mt-0.5',
  noticeBg: 'p-5 bg-pink-50/60 rounded-2xl border border-rose-100',
  mapInfoBg: 'mt-6 p-4 bg-white/60 rounded-2xl border border-rose-100 text-center',
  transportCard: 'mt-4 p-5 bg-pink-50/60 rounded-2xl border border-rose-100',
  sectionBg: { rsvp: 'bg-rose-50/30' },
  greetingDecorTop: <FloralDecor />,
  greetingDecorBottom: <FloralDecor />,
  greetingMaxWidth: 'max-w-lg w-full',
  greetingAlign: 'text-center',
  galleryGap: 'gap-3',
  galleryItemClass: 'aspect-square overflow-hidden rounded-2xl shadow-sm cursor-pointer border border-rose-100',
  galleryHover: 'hover:scale-110 transition-transform duration-300',
  galleryItemMotion: (i) => ({ initial: { opacity: 0, scale: 0.9 }, whileInView: { opacity: 1, scale: 1 }, transition: { delay: i * 0.08 } }),
  parentsGrid: 'grid md:grid-cols-2 gap-8',
  parentsCardWrapper: 'text-center bg-white/50 rounded-2xl p-6 border border-rose-100',
  groomMotion: { initial: { opacity: 0, scale: 0.95 }, whileInView: { opacity: 1, scale: 1 }, transition: { duration: 0.5 } },
  brideMotion: { initial: { opacity: 0, scale: 0.95 }, whileInView: { opacity: 1, scale: 1 }, transition: { duration: 0.5, delay: 0.1 } },
  accountsSpacing: 'space-y-6',
  accountCardsSpacing: 'space-y-3',
  cardLabelClass: 'font-serif text-sm text-rose-800 mb-1',
  cardValueClass: 'text-sm text-rose-600/70',
  cardSubTextClass: 'text-xs text-rose-500/70',
  noticeTextClass: 'text-xs text-rose-500/70 whitespace-pre-line leading-relaxed',
  transportLabelClass: 'text-xs font-semibold text-rose-700 mb-2',
  transportTextClass: 'text-xs text-rose-500/70 whitespace-pre-line leading-relaxed',
  ceremonyDateLabel: '예식 일시',
  ceremonyVenueLabel: '예식 장소',
  mapVenueNameClass: 'text-sm text-rose-800 font-medium',
  mapAddressClass: 'text-xs text-rose-500/70 mt-1',
  sectionDivider: undefined,
  postCoverDivider: undefined,
  mapHeading: <FloralLineHeading>오시는 길</FloralLineHeading>,
};

export const elegantTheme: TemplateTheme = {
  id: 'elegant',
  containerBg: 'min-h-screen bg-gradient-to-b from-amber-50/30 via-white to-slate-50',
  sectionPadding: 'py-16 md:py-24 px-6',
  contentMaxWidth: 'max-w-2xl mx-auto',
  galleryMaxWidth: 'max-w-4xl mx-auto',
  headingClass: 'text-xl md:text-2xl font-serif text-center text-slate-800 mb-8 md:mb-12',
  bodyText: 'text-sm md:text-base text-slate-600 leading-relaxed whitespace-pre-line font-light',
  nameClass: 'text-2xl md:text-3xl font-serif text-white mb-3',
  labelClass: 'text-xs tracking-[0.3em] text-amber-400/80 uppercase mb-4',
  cardClass: 'flex items-start gap-4 p-6 bg-white rounded-lg border border-slate-200 shadow-sm',
  accountCardClass: 'p-4 bg-white rounded-lg border border-slate-200 text-center',
  iconColor: 'text-amber-500',
  accentColor: 'text-amber-600 hover:text-amber-700',
  sideLabel: 'text-sm font-semibold text-slate-700 mb-4 text-center',
  phoneLinkClass: 'inline-flex items-center gap-2 text-sm text-slate-400 hover:text-amber-400 transition-colors py-2 min-h-[44px]',
  accountTypeLabel: 'text-xs text-slate-400 mb-1',
  accountName: 'text-sm font-medium text-slate-800',
  accountDetail: 'text-sm text-slate-500 mt-1',
  accountHolder: 'text-xs text-slate-400 mt-0.5',
  noticeBg: 'p-6 bg-amber-50/50 rounded-lg border border-amber-100',
  mapInfoBg: 'mt-6 p-4 bg-white rounded-lg border border-slate-200 text-center',
  transportCard: 'mt-4 p-4 bg-white rounded-lg border border-slate-200',
  sectionBg: { parents: 'bg-slate-800', gallery: 'bg-slate-800', map: 'bg-slate-50', rsvp: 'bg-slate-50' },
  greetingDecorTop: <ElegantDiamondDecor />,
  greetingDecorBottom: <ElegantDiamondDecor />,
  greetingMaxWidth: 'max-w-2xl w-full',
  greetingAlign: 'text-center',
  galleryGap: 'gap-3',
  galleryItemClass: 'aspect-square overflow-hidden rounded-lg cursor-pointer',
  galleryHover: 'hover:scale-110 transition-transform duration-500',
  galleryItemMotion: (i) => ({ initial: { opacity: 0, scale: 0.95 }, whileInView: { opacity: 1, scale: 1 }, transition: { delay: i * 0.08 } }),
  parentsGrid: 'grid md:grid-cols-2 gap-10',
  parentsRoleLabel: true,
  parentsFamilyNameClass: 'text-xs text-slate-400 mb-2',
  groomMotion: { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 } },
  brideMotion: { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, transition: { delay: 0.1 } },
  accountsSpacing: 'space-y-8',
  accountCardsSpacing: 'space-y-3',
  cardLabelClass: 'text-xs tracking-[0.2em] text-slate-400 uppercase mb-2',
  cardValueClass: 'text-base text-slate-800',
  cardSubTextClass: 'text-sm text-slate-500',
  noticeTextClass: 'text-sm text-slate-600 whitespace-pre-line leading-relaxed',
  transportLabelClass: 'text-xs font-semibold text-slate-700 mb-2',
  transportTextClass: 'text-sm text-slate-600 leading-relaxed whitespace-pre-line',
  ceremonyDateLabel: 'Date & Time',
  ceremonyVenueLabel: 'Location',
  mapVenueNameClass: 'text-base font-medium text-slate-800',
  mapAddressClass: 'text-sm text-slate-500 mt-1',
  sectionDivider: undefined,
  postCoverDivider: undefined,
  galleryHeading: <ElegantSubLabelHeading label="Moments">Gallery</ElegantSubLabelHeading>,
  accountsHeading: <ElegantSubLabelHeading label="Gift">마음 전하실 곳</ElegantSubLabelHeading>,
  mapHeading: <ElegantSubLabelHeading label="Location">오시는 길</ElegantSubLabelHeading>,
};

export const naturalTheme: TemplateTheme = {
  id: 'natural',
  containerBg: 'min-h-screen bg-gradient-to-b from-stone-50 via-emerald-50/20 to-stone-50',
  sectionPadding: 'py-16 md:py-24 px-6',
  contentMaxWidth: 'max-w-2xl mx-auto',
  galleryMaxWidth: 'max-w-4xl mx-auto',
  headingClass: 'text-xl md:text-2xl font-light text-center text-stone-800 mb-8 md:mb-12',
  bodyText: 'text-sm md:text-base text-stone-600 leading-loose whitespace-pre-line',
  nameClass: 'text-2xl md:text-3xl font-light text-stone-800 mb-3',
  labelClass: 'text-xs tracking-[0.2em] text-emerald-600/70 uppercase mb-3',
  cardClass: 'flex items-start gap-4 p-6 bg-white rounded-2xl border border-emerald-100 shadow-sm',
  accountCardClass: 'p-4 bg-white/80 rounded-2xl border border-emerald-100 text-center',
  iconColor: 'text-emerald-500',
  accentColor: 'text-emerald-600 hover:text-emerald-700',
  sideLabel: 'text-sm font-medium text-emerald-700 mb-4 text-center',
  phoneLinkClass: 'inline-flex items-center gap-2 text-sm text-stone-500 hover:text-emerald-600 transition-colors py-2 min-h-[44px]',
  accountTypeLabel: 'text-xs text-stone-400 mb-1',
  accountName: 'text-sm font-medium text-stone-800',
  accountDetail: 'text-sm text-stone-500 mt-1',
  accountHolder: 'text-xs text-stone-400 mt-0.5',
  noticeBg: 'p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100',
  mapInfoBg: 'mt-6 p-4 bg-white/80 rounded-2xl border border-emerald-100 text-center',
  transportCard: 'mt-4 p-4 bg-white/80 rounded-2xl border border-emerald-100',
  sectionBg: { parents: 'bg-emerald-50/30', accounts: 'bg-emerald-50/30', map: 'bg-emerald-50/30' },
  greetingDecorTop: <NaturalLeafDecor />,
  greetingDecorBottom: <NaturalLeafDecor />,
  greetingMaxWidth: 'max-w-2xl w-full',
  greetingAlign: 'text-center',
  galleryGap: 'gap-4',
  galleryItemClass: 'aspect-square overflow-hidden rounded-2xl cursor-pointer shadow-sm',
  galleryHover: 'hover:scale-105 transition-transform duration-500',
  galleryItemMotion: (i) => ({ initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, transition: { delay: i * 0.08 } }),
  parentsGrid: 'grid md:grid-cols-2 gap-10',
  parentsCardWrapper: 'text-center p-6 bg-white/60 rounded-2xl',
  parentsRoleLabel: true,
  parentsFamilyNameClass: 'text-xs text-stone-400 mb-2',
  groomMotion: { initial: { opacity: 0, x: -20 }, whileInView: { opacity: 1, x: 0 } },
  brideMotion: { initial: { opacity: 0, x: 20 }, whileInView: { opacity: 1, x: 0 } },
  accountsSpacing: 'space-y-8',
  accountCardsSpacing: 'space-y-3',
  cardLabelClass: 'text-xs tracking-[0.15em] text-emerald-600/70 uppercase mb-2',
  cardValueClass: 'text-base text-stone-700',
  cardSubTextClass: 'text-sm text-stone-500',
  noticeTextClass: 'text-sm text-stone-600 whitespace-pre-line leading-relaxed',
  transportLabelClass: 'text-xs font-semibold text-stone-700 mb-2',
  transportTextClass: 'text-sm text-stone-600 leading-relaxed whitespace-pre-line',
  ceremonyDateLabel: 'Date & Time',
  ceremonyVenueLabel: 'Location',
  mapVenueNameClass: 'text-base font-medium text-stone-800',
  mapAddressClass: 'text-sm text-stone-500 mt-1',
  sectionDivider: undefined,
  postCoverDivider: undefined,
  galleryHeading: <NaturalLeafHeading>Gallery</NaturalLeafHeading>,
  accountsHeading: <NaturalLeafHeading>마음 전하실 곳</NaturalLeafHeading>,
  mapHeading: <NaturalLeafHeading>오시는 길</NaturalLeafHeading>,
};

// ── 테마 레지스트리 ──

export const themes: Record<string, TemplateTheme> = {
  classic: classicTheme,
  modern: modernTheme,
  minimal: minimalTheme,
  floral: floralTheme,
  elegant: elegantTheme,
  natural: naturalTheme,
};

export function getTheme(templateId: string): TemplateTheme {
  return themes[templateId] ?? classicTheme;
}
