# 템플릿 리팩토링 구현 가이드

> 작성일: 2026-02-06
> beads: cuggu-cul
> 브랜치: feature/template-refactor

---

## 1. 현재 문제

6개 템플릿 파일이 각 ~550줄, 총 ~3300줄. **72%가 중복 코드**.
새 섹션 추가 시 6개 파일 모두 수정 필요 (D-Day, 엔딩, 방명록 등).

## 2. 리팩토링 목표

- 새 섹션 추가 = **1개 파일** 수정 (현재 6개)
- ~3300줄 → ~1400줄 (58% 감소)
- 각 템플릿 파일: 550줄 → ~100줄 (커버+푸터+테마만)

## 3. 아키텍처

```
[TemplateFile]  →  테마 정의 + 커버 JSX + 푸터 JSX
     ↓
[BaseTemplate]  →  섹션 오더링, divider, lightbox 상태
     ↓
[Section Components]  →  theme props로 스타일 적용
```

커버/푸터는 각 템플릿의 **정체성**이므로 템플릿 파일에 유지.
바디 섹션(greeting~rsvp)만 공유 컴포넌트로 추출.

## 4. 신규 파일 구조

```
lib/templates/
  themes.ts                          # TemplateTheme 타입 + 6개 테마 정의

components/templates/
  BaseTemplate.tsx                   # 섹션 오케스트레이터
  sections/
    GreetingSection.tsx              # 인사말
    ParentsSection.tsx               # 신랑/신부 정보
    CeremonySection.tsx              # 예식 정보 (날짜/장소/공지)
    MapInfoSection.tsx               # 지도 + 내비 + 교통편
    GallerySection.tsx               # 갤러리 그리드 + 라이트박스
    AccountsSection.tsx              # 계좌번호
    RsvpSectionWrapper.tsx           # RSVP 래핑
```

## 5. TemplateTheme 타입 정의

```typescript
// lib/templates/themes.ts

import type { ReactNode } from 'react';

export interface TemplateTheme {
  id: string;

  // ── 컨테이너 ──
  containerBg: string;
  // e.g. "min-h-screen bg-gradient-to-b from-amber-50 via-white to-amber-50"

  // ── 섹션 공통 ──
  sectionPadding: string;       // "py-12 md:py-20 px-6"
  contentMaxWidth: string;      // "max-w-2xl mx-auto"
  galleryMaxWidth: string;      // "max-w-4xl mx-auto"

  // ── 타이포그래피 ──
  headingClass: string;         // "text-xl md:text-2xl font-serif text-center text-gray-800 mb-8 md:mb-12"
  bodyText: string;             // "text-sm md:text-base text-gray-700 leading-relaxed whitespace-pre-line"
  nameClass: string;            // "text-2xl md:text-3xl font-serif text-gray-800 mb-3 md:mb-4"
  labelClass: string;           // "text-xs md:text-sm text-amber-800 mb-3 md:mb-4 font-medium"

  // ── 카드 ──
  cardClass: string;            // "p-4 md:p-6 bg-white rounded-lg shadow-sm border border-amber-100"
  accountCardClass: string;     // "p-4 md:p-5 bg-white rounded-xl shadow-sm border border-amber-100"

  // ── 색상 ──
  iconColor: string;            // "text-amber-600"
  accentColor: string;          // "text-amber-600 hover:text-amber-700"
  sideLabel: string;            // "text-sm md:text-base text-amber-800 mb-3 font-semibold"
  phoneLinkClass: string;       // "inline-flex items-center gap-2 text-sm text-gray-600 hover:text-amber-600 ..."
  accountTypeLabel: string;     // "text-xs text-slate-500 mb-2"
  accountName: string;          // "text-sm md:text-base text-gray-800 font-medium mb-1"
  accountDetail: string;        // "text-xs md:text-sm text-gray-600"
  accountHolder: string;        // "text-xs text-gray-500"

  // ── 배경 ──
  noticeBg: string;             // "p-4 md:p-6 bg-amber-50 rounded-lg"
  mapInfoBg: string;            // "mt-4 p-4 bg-amber-50/60 rounded-lg"
  transportCard: string;        // "mt-4 p-4 bg-white rounded-lg border border-amber-100"

  // ── 섹션별 배경 (선택적) ──
  sectionBg: Partial<Record<string, string>>;
  // e.g. { parents: "bg-amber-50/30", gallery: "bg-amber-50/30", rsvp: "bg-amber-50/30" }

  // ── 인사말 ──
  greetingDecor?: ReactNode;
  greetingMaxWidth: string;     // "max-w-2xl w-full"

  // ── 갤러리 ──
  galleryGap: string;           // "gap-3 md:gap-4"
  galleryItemClass: string;     // "aspect-square overflow-hidden rounded-lg shadow-md cursor-pointer"
  galleryHover: string;         // "hover:scale-110 transition-transform duration-300"
  galleryItemMotion: (index: number) => object; // per-item animation

  // ── 부모 섹션 ──
  parentsGrid: string;          // "grid md:grid-cols-2 gap-8 md:gap-12"
  parentsCardWrapper?: string;  // optional card around each parent (Floral/Natural)
  groomMotion: object;          // motion.div initial/whileInView props
  brideMotion: object;

  // ── 계좌 ──
  accountsSpacing: string;      // "space-y-6 md:space-y-8"
  accountCardsSpacing: string;  // "space-y-3"

  // ── 디바이더 ──
  sectionDivider?: ReactNode;   // null | horizontal line | vertical line
  postCoverDivider?: ReactNode; // Modern: gradient line, Minimal: vertical line

  // ── 지도 헤딩 (일부 템플릿은 decoration 포함) ──
  mapHeading?: ReactNode;       // custom heading override (Floral/Elegant/Natural)
  galleryHeading?: ReactNode;   // custom heading override
  accountsHeading?: ReactNode;  // custom heading override
}
```

## 6. 6개 테마 정의

### Classic

```typescript
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
  greetingDecor: '🌸', // text-3xl md:text-4xl mb-6 md:mb-8
  greetingMaxWidth: 'max-w-2xl w-full',
  galleryGap: 'gap-3 md:gap-4',
  galleryItemClass: 'aspect-square overflow-hidden rounded-lg shadow-md cursor-pointer',
  galleryHover: 'hover:scale-110 transition-transform duration-300',
  galleryItemMotion: (i) => ({ initial: { opacity: 0, scale: 0.9 }, whileInView: { opacity: 1, scale: 1 }, transition: { delay: i * 0.1 } }),
  parentsGrid: 'grid md:grid-cols-2 gap-8 md:gap-12',
  groomMotion: { initial: { opacity: 0, x: -20 }, whileInView: { opacity: 1, x: 0 } },
  brideMotion: { initial: { opacity: 0, x: 20 }, whileInView: { opacity: 1, x: 0 } },
  accountsSpacing: 'space-y-6 md:space-y-8',
  accountCardsSpacing: 'space-y-3',
  sectionDivider: undefined,
  postCoverDivider: undefined,
};
```

### Modern

```typescript
export const modernTheme: TemplateTheme = {
  id: 'modern',
  containerBg: 'min-h-screen bg-zinc-50',
  sectionPadding: 'py-16 md:py-24 px-8 md:px-12',
  contentMaxWidth: 'max-w-2xl',           // no mx-auto (Modern is left-aligned in some areas)
  galleryMaxWidth: 'max-w-4xl',
  headingClass: 'text-xs tracking-[0.3em] text-emerald-600 uppercase mb-6',
  bodyText: 'text-base md:text-lg text-zinc-600 leading-relaxed whitespace-pre-line',
  nameClass: 'text-2xl md:text-3xl font-bold text-zinc-900 mb-3',
  labelClass: 'text-xs text-zinc-400 mb-2',
  cardClass: 'flex items-start gap-4',    // no bg/border (flat design)
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
  mapInfoBg: 'mt-6 space-y-2',           // no card bg
  transportCard: 'mt-6 p-4 bg-zinc-100 rounded-lg',
  sectionBg: { gallery: 'bg-zinc-100' },
  greetingDecor: undefined,               // "Greeting" uppercase label instead
  greetingMaxWidth: 'max-w-2xl w-full',
  galleryGap: 'gap-2',
  galleryItemClass: 'aspect-square overflow-hidden cursor-pointer',
  galleryHover: 'hover:scale-105 transition-transform duration-500',
  galleryItemMotion: (i) => ({ initial: { opacity: 0, scale: 0.95 }, whileInView: { opacity: 1, scale: 1 }, transition: { delay: i * 0.08 } }),
  parentsGrid: 'grid md:grid-cols-2 gap-12',
  groomMotion: { initial: { opacity: 0, x: -20 }, whileInView: { opacity: 1, x: 0 }, transition: { duration: 0.5 } },
  brideMotion: { initial: { opacity: 0, x: 20 }, whileInView: { opacity: 1, x: 0 }, transition: { duration: 0.5 } },
  accountsSpacing: 'space-y-8',
  accountCardsSpacing: 'space-y-3',
  sectionDivider: <div className="h-px bg-zinc-200 mx-8 md:mx-12" />,
  postCoverDivider: <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />,
};
```

### Minimal

```typescript
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
  cardClass: 'text-center',             // no card at all
  accountCardClass: 'py-3',             // minimal
  iconColor: 'text-stone-300',
  accentColor: 'text-stone-400 hover:text-stone-600',
  sideLabel: 'text-xs font-medium text-stone-700 mb-4 tracking-wide',
  phoneLinkClass: 'inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors py-2 min-h-[44px]',
  accountTypeLabel: 'text-[10px] text-stone-400 mb-1',
  accountName: 'text-xs text-stone-700',
  accountDetail: 'text-xs text-stone-400 mt-1',
  accountHolder: 'text-[10px] text-stone-300 mt-0.5',
  noticeBg: 'pt-6',                     // divider line above, no bg
  mapInfoBg: 'mt-6 space-y-1',
  transportCard: 'mt-6',               // minimal, just text
  sectionBg: {},                         // no colored backgrounds
  greetingDecor: undefined,
  greetingMaxWidth: 'max-w-md w-full',
  galleryGap: 'gap-1',
  galleryItemClass: 'aspect-square overflow-hidden cursor-pointer',
  galleryHover: 'hover:opacity-80 transition-opacity duration-300',
  galleryItemMotion: (i) => ({ initial: { opacity: 0 }, whileInView: { opacity: 1 }, transition: { delay: i * 0.05 } }),
  parentsGrid: 'grid grid-cols-2 gap-12',
  groomMotion: { initial: { opacity: 0 }, whileInView: { opacity: 1 }, transition: { duration: 0.6 } },
  brideMotion: { initial: { opacity: 0 }, whileInView: { opacity: 1 }, transition: { duration: 0.6, delay: 0.1 } },
  accountsSpacing: 'space-y-10',
  accountCardsSpacing: 'space-y-4',
  sectionDivider: <div className="flex justify-center py-4"><div className="h-12 w-px bg-stone-200" /></div>,
  postCoverDivider: <div className="flex justify-center py-4"><div className="h-12 w-px bg-stone-200" /></div>,
};
```

### Floral

```typescript
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
  greetingDecor: '❀',   // Floral decoration with gradient lines around it
  greetingMaxWidth: 'max-w-lg w-full',
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
  sectionDivider: undefined,
  postCoverDivider: undefined,
};
```

### Elegant

```typescript
export const elegantTheme: TemplateTheme = {
  id: 'elegant',
  containerBg: 'min-h-screen bg-gradient-to-b from-amber-50/30 via-white to-slate-50',
  sectionPadding: 'py-16 md:py-24 px-6',
  contentMaxWidth: 'max-w-2xl mx-auto',
  galleryMaxWidth: 'max-w-4xl mx-auto',
  headingClass: 'text-xl md:text-2xl font-serif text-center text-slate-800 mb-8 md:mb-12',
  // Note: Elegant headings have sub-label "text-xs tracking-[0.3em] text-amber-500 uppercase mb-2"
  bodyText: 'text-sm md:text-base text-slate-600 leading-relaxed whitespace-pre-line font-light',
  nameClass: 'text-2xl md:text-3xl font-serif text-white mb-3',  // parents on dark bg
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
  greetingDecor: '◇',   // Gold diamond ornament with gradient lines
  greetingMaxWidth: 'max-w-2xl w-full',
  galleryGap: 'gap-3',
  galleryItemClass: 'aspect-square overflow-hidden rounded-lg cursor-pointer',
  galleryHover: 'hover:scale-110 transition-transform duration-500',
  galleryItemMotion: (i) => ({ initial: { opacity: 0, scale: 0.95 }, whileInView: { opacity: 1, scale: 1 }, transition: { delay: i * 0.08 } }),
  parentsGrid: 'grid md:grid-cols-2 gap-10',
  groomMotion: { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 } },
  brideMotion: { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, transition: { delay: 0.1 } },
  accountsSpacing: 'space-y-8',
  accountCardsSpacing: 'space-y-3',
  sectionDivider: undefined,
  postCoverDivider: undefined,
};
```

### Natural

```typescript
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
  greetingDecor: '🌿',   // Leaf emoji pair
  greetingMaxWidth: 'max-w-2xl w-full',
  galleryGap: 'gap-4',
  galleryItemClass: 'aspect-square overflow-hidden rounded-2xl cursor-pointer shadow-sm',
  galleryHover: 'hover:scale-105 transition-transform duration-500',
  galleryItemMotion: (i) => ({ initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, transition: { delay: i * 0.08 } }),
  parentsGrid: 'grid md:grid-cols-2 gap-10',
  parentsCardWrapper: 'text-center p-6 bg-white/60 rounded-2xl',
  groomMotion: { initial: { opacity: 0, x: -20 }, whileInView: { opacity: 1, x: 0 } },
  brideMotion: { initial: { opacity: 0, x: 20 }, whileInView: { opacity: 1, x: 0 } },
  accountsSpacing: 'space-y-8',
  accountCardsSpacing: 'space-y-3',
  sectionDivider: undefined,
  postCoverDivider: undefined,
};
```

## 7. BaseTemplate 설계

```typescript
// components/templates/BaseTemplate.tsx

interface BaseTemplateProps {
  data: Invitation;
  theme: TemplateTheme;
  isPreview?: boolean;
  coverSection: ReactNode;
  footerSection: ReactNode;
}

export function BaseTemplate({ data, theme, isPreview, coverSection, footerSection }: BaseTemplateProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const sectionOrder = sanitizeSectionOrder(data.settings.sectionOrder as SectionId[] | undefined);

  const hasAccounts = /* ... existing logic ... */;

  const sections: Record<SectionId, () => ReactNode> = {
    greeting: () => <GreetingSection data={data} theme={theme} />,
    parents: () => data.settings.showParents ? <ParentsSection data={data} theme={theme} /> : null,
    ceremony: () => <CeremonySection data={data} theme={theme} />,
    map: () => (data.settings.showMap && data.wedding.venue.lat && data.wedding.venue.lng)
      ? <MapInfoSection data={data} theme={theme} /> : null,
    gallery: () => data.gallery.images.length > 0
      ? <GallerySection data={data} theme={theme} lightboxIndex={lightboxIndex} setLightboxIndex={setLightboxIndex} /> : null,
    accounts: () => (data.settings.showAccounts && hasAccounts)
      ? <AccountsSection data={data} theme={theme} /> : null,
    rsvp: () => data.settings.enableRsvp
      ? <RsvpSectionWrapper data={data} theme={theme} /> : null,
  };

  // 섹션 렌더링 (divider 지원)
  const renderedSections = sectionOrder
    .map(id => ({ id, node: sections[id]() }))
    .filter(({ node }) => node !== null);

  return (
    <div className={theme.containerBg}>
      {coverSection}
      {theme.postCoverDivider}

      {renderedSections.map(({ id, node }, idx) => (
        <Fragment key={id}>
          {idx > 0 && theme.sectionDivider}
          {node}
        </Fragment>
      ))}

      {footerSection}
    </div>
  );
}
```

## 8. 섹션 컴포넌트 시그니처

각 섹션은 동일한 패턴:

```typescript
interface SectionProps {
  data: Invitation;
  theme: TemplateTheme;
}

// 갤러리만 추가 props
interface GallerySectionProps extends SectionProps {
  lightboxIndex: number | null;
  setLightboxIndex: (index: number | null) => void;
}
```

## 9. 슬림화된 템플릿 예시 (Classic)

```typescript
// components/templates/ClassicTemplate.tsx (~100줄)
"use client";

import { classicTheme } from '@/lib/templates/themes';
import { BaseTemplate } from './BaseTemplate';
import type { Invitation } from '@/schemas/invitation';
import { motion } from 'framer-motion';
import { formatWeddingDate, formatWeddingTime } from '@/lib/utils/date';

interface ClassicTemplateProps {
  data: Invitation;
  isPreview?: boolean;
}

export function ClassicTemplate({ data, isPreview = false }: ClassicTemplateProps) {
  const weddingDate = new Date(data.wedding.date);
  const dateStr = formatWeddingDate(weddingDate);
  const timeStr = formatWeddingTime(weddingDate);

  const cover = (
    <section
      className="relative flex flex-col items-center justify-center overflow-hidden px-6"
      style={{ minHeight: 'var(--screen-height, 100vh)' }}
    >
      {/* ... Classic 고유 커버 JSX ... */}
    </section>
  );

  const footer = (
    <footer className="py-8 md:py-12 px-6 text-center text-xs md:text-sm text-gray-500 border-t border-amber-100">
      {/* ... Classic 고유 푸터 JSX ... */}
    </footer>
  );

  return (
    <BaseTemplate
      data={data}
      theme={classicTheme}
      isPreview={isPreview}
      coverSection={cover}
      footerSection={footer}
    />
  );
}
```

## 10. 마이그레이션 순서

1. `lib/templates/themes.ts` 생성 (TemplateTheme 타입 + 6개 테마)
2. `components/templates/sections/` 7개 컴포넌트 생성
3. `components/templates/BaseTemplate.tsx` 생성
4. ClassicTemplate 마이그레이션 → 렌더링 확인
5. 나머지 5개 순차 마이그레이션
6. `npx tsc --noEmit` 전체 타입 체크
7. 공개 청첩장 페이지에서 6개 템플릿 모두 확인

## 11. 주의사항

### 장식 요소 처리
일부 템플릿은 섹션 헤딩에 커스텀 장식이 있음:
- **Floral**: 꽃 장식 라인 `─── ❀ ───`
- **Elegant**: 다이아몬드 장식 `─── ◇ ───`
- **Natural**: 잎 이모지 `🌿`
- **Modern**: 섹션 레이블 ("Greeting", "Gallery" 등 uppercase)

→ `theme.greetingDecor`, `theme.mapHeading`, `theme.galleryHeading`, `theme.accountsHeading`으로 ReactNode 주입.
섹션 컴포넌트에서: `theme.galleryHeading || <h2 className={theme.headingClass}>Gallery</h2>`

### Elegant 부모 섹션 - 다크 배경
Elegant의 parents 섹션은 `bg-slate-800`에 `text-white` 사용.
→ `theme.sectionBg.parents`가 있으면 섹션에 적용.
→ `theme.nameClass`가 `text-white`를 포함하므로 자연스럽게 대응.

### Modern/Minimal - 섹션 디바이더
→ `theme.sectionDivider` ReactNode로 처리. BaseTemplate에서 섹션 사이에 삽입.

### Tailwind Purge 안전성
테마에 **완전한 Tailwind 클래스 문자열만** 사용 (동적 조합 절대 금지).
`text-${color}` 같은 패턴은 purge에서 누락됨.
모든 클래스가 themes.ts 파일에 리터럴로 존재하므로 purge 안전.

---

## 12. 섹션별 상세 스타일 비교 (원본 데이터)

아래는 구현 시 참조할 6개 템플릿의 섹션별 정확한 Tailwind 클래스 차이.

### 커버 섹션

| | Classic | Modern | Minimal | Floral | Elegant | Natural |
|---|---------|--------|---------|--------|---------|---------|
| 컨테이너 bg | `from-amber-50 via-white to-amber-50` | `bg-zinc-50` | `bg-white` | `from-rose-50 via-pink-50/30 to-rose-50` | `from-amber-50/30 via-white to-slate-50` | `from-stone-50 via-emerald-50/20 to-stone-50` |
| 커버 정렬 | center | bottom-right | center | center | center | center |
| 이미지 opacity | `opacity-40` | 없음(full) | `opacity-20 grayscale` | `opacity-30` | `opacity-30` | `opacity-40` |
| 그라디언트 | `via-white/50 to-white` | `from-zinc-900/80` (dark) | 없음 | `from-rose-50/60` | `from-slate-900/20` | `from-stone-50/50` |
| 이름 크기 | `text-3xl md:text-4xl serif` | `text-5xl md:text-7xl bold` | `text-3xl md:text-4xl light` | `text-3xl md:text-4xl serif` | `text-4xl md:text-5xl serif` | `text-4xl md:text-5xl light` |

### 인사말 섹션

| | Classic | Modern | Minimal | Floral | Elegant | Natural |
|---|---------|--------|---------|--------|---------|---------|
| 패딩 | `py-12 md:py-20` | `py-16 md:py-24` | `py-16 md:py-24` | `py-14 md:py-20` | `py-16 md:py-24` | `py-16 md:py-24` |
| maxWidth | `max-w-2xl` | `max-w-2xl` | `max-w-md` | `max-w-lg` | `max-w-2xl` | `max-w-2xl` |
| 장식 | 🌸 | "Greeting" 레이블 | 없음 | ❀ + 라인 | ◇ + 라인 | 🌿 |
| 텍스트 | `text-gray-700` | `text-zinc-600` | `text-stone-500 font-light` | `text-rose-800/70 serif` | `text-slate-600 font-light` | `text-stone-600` |

### 부모 섹션

| | Classic | Modern | Minimal | Floral | Elegant | Natural |
|---|---------|--------|---------|--------|---------|---------|
| 배경 | `bg-amber-50/30` | 없음 | 없음 | 없음 | `bg-slate-800` (다크) | `bg-emerald-50/30` |
| 카드 래핑 | 없음 | 없음 | 없음 | `bg-white/50 rounded-2xl border-rose-100` | 없음 | `bg-white/60 rounded-2xl` |
| 이름 폰트 | `serif` | `bold` | `light` | `serif` | `serif text-white` | `light` |
| 애니메이션 | slide-x | slide-x | fade | scale | slide-y | slide-x |

### 예식 정보 섹션

| | Classic | Modern | Minimal | Floral | Elegant | Natural |
|---|---------|--------|---------|--------|---------|---------|
| 카드 | `bg-white rounded-lg border-amber-100` | flat (no card) | text only | `bg-white/60 rounded-2xl border-rose-100` | `bg-white rounded-lg border-slate-200` | `bg-white rounded-2xl border-emerald-100` |
| 아이콘 | `text-amber-600` | `text-emerald-500` | `text-stone-300` | `text-rose-400` | `text-amber-500` | `text-emerald-500` |
| 공지 배경 | `bg-amber-50` | `border-l-2 border-emerald-400` | text only | `bg-pink-50/60 rounded-2xl` | `bg-amber-50/50 border-amber-100` | `bg-emerald-50/50 rounded-2xl` |

### 갤러리 섹션

| | Classic | Modern | Minimal | Floral | Elegant | Natural |
|---|---------|--------|---------|--------|---------|---------|
| 배경 | `bg-amber-50/30` | `bg-zinc-100` | 없음 | 없음 | `bg-slate-800` | 없음 |
| gap | `gap-3 md:gap-4` | `gap-2` | `gap-1` | `gap-3` | `gap-3` | `gap-4` |
| 아이템 | `rounded-lg shadow-md` | flat | flat | `rounded-2xl border-rose-100` | `rounded-lg` | `rounded-2xl shadow-sm` |
| hover | `scale-110 300ms` | `scale-105 500ms` | `opacity-80 300ms` | `scale-110 300ms` | `scale-110 500ms` | `scale-105 500ms` |

### 계좌 섹션

| | Classic | Modern | Minimal | Floral | Elegant | Natural |
|---|---------|--------|---------|--------|---------|---------|
| 배경 | 없음 | 없음 | 없음 | 없음 | 없음 | `bg-emerald-50/30` |
| 카드 | `rounded-xl border-amber-100` | `border-b border-zinc-200` | flat | `rounded-2xl border-rose-100` | `rounded-lg border-slate-200` | `rounded-2xl border-emerald-100` |

### RSVP 섹션

| | Classic | Modern | Minimal | Floral | Elegant | Natural |
|---|---------|--------|---------|--------|---------|---------|
| 배경 | `bg-amber-50/30` | 없음 | 없음 | `bg-rose-50/30` | `bg-slate-50` | 없음 |

### 푸터

| | Classic | Modern | Minimal | Floral | Elegant | Natural |
|---|---------|--------|---------|--------|---------|---------|
| 배경 | 없음 | 없음 | 없음 | 없음 | `bg-slate-800` | 없음 |
| 테두리 | `border-amber-100` | `border-zinc-200` | 없음 | 없음 | 없음 | 없음 |
| 링크 색 | `text-amber-600` | `text-emerald-600` | `text-stone-300` | `text-rose-300` | `text-amber-400` | `text-emerald-600` |
| 장식 | 없음 | 없음 | `h-px w-8 bg-stone-200` | ❀ + 라인 | ◇ + 라인 | 🌿 |

### 디바이더

| | Classic | Modern | Minimal | Floral | Elegant | Natural |
|---|---------|--------|---------|--------|---------|---------|
| 섹션 간 | 없음 | `h-px bg-zinc-200 mx-8` | `h-12 w-px bg-stone-200` (세로) | 없음 | 없음 | 없음 |
| 커버 후 | 없음 | `via-emerald-500/40` gradient | 세로 라인 | 없음 | 없음 | 없음 |
