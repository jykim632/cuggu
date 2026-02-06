# 템플릿 직렬화 + AI 테마 생성 구현 가이드

> 작성일: 2026-02-06
> 선행 작업: template-refactoring-guide.md (BaseTemplate + 섹션 추출 완료)
> 브랜치: feature/template-refactor

---

## 1. 현재 상태 & 문제

BaseTemplate + 7개 섹션 컴포넌트 리팩토링은 완료됨. 하지만 `TemplateTheme`에 **직렬화 불가능한 필드**가 있어서 JSON 저장/AI 생성이 불가능:

| 필드 | 현재 타입 | 문제 |
|------|-----------|------|
| `sectionDivider`, `postCoverDivider` | `ReactNode` | JSON 변환 불가 |
| `greetingDecorTop/Bottom` | `ReactNode` | JSON 변환 불가 |
| `mapHeading`, `galleryHeading`, `accountsHeading` | `ReactNode` | JSON 변환 불가 |
| `parentsHeading`, `ceremonyHeading` | `ReactNode` | JSON 변환 불가 |
| `accountsDivider` | `ReactNode` | JSON 변환 불가 |
| `galleryItemMotion` | `(index: number) => object` | 함수, JSON 불가 |
| `groomMotion`, `brideMotion` | `object` | 직렬화 가능하지만 타입 미정의 |
| 커버/푸터 | 각 템플릿 파일의 JSX | 파라미터화 필요 |

## 2. 목표

1. `TemplateTheme` → `SerializableTheme` (100% JSON-safe)
2. 커버/푸터를 config 기반 공유 컴포넌트로 변환
3. 인앱 AI 테마 생성 기능 (Anthropic Claude API)
4. 각 템플릿 파일 ~80줄 → ~15줄

## 3. 아키텍처

```
SerializableTheme (JSON)
  ├── DB 저장 가능 (templates.config / extendedData.customTheme)
  ├── AI API로 생성 가능 (Claude tool_use)
  └── 렌더러 컴포넌트가 JSX로 변환
       ├── DividerRenderer   ← DividerConfig
       ├── DecorationRenderer ← DecorationConfig
       ├── HeadingRenderer    ← HeadingConfig
       ├── CoverSection       ← CoverConfig
       ├── FooterSection      ← FooterConfig
       └── resolveAnimation() ← AnimationConfig → framer-motion props
```

---

## 4. SerializableTheme 타입 시스템

### 4-1. DividerConfig

현재 ReactNode로 표현된 디바이더를 데이터로 변환.

```typescript
// lib/templates/types.ts

type DividerType = 'none' | 'horizontal-line' | 'vertical-line' | 'gradient-line';

interface DividerConfig {
  type: DividerType;
  colorClass: string;        // "bg-zinc-200"
  widthClass?: string;       // "w-8" (짧은 라인)
  heightClass?: string;      // "h-12" (세로 라인)
  marginClass?: string;      // "mx-8 md:mx-12"
  gradientClass?: string;    // "bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent"
  containerClass?: string;   // "flex justify-center py-4"
}
```

**현재 → 변환 예시:**

| 템플릿 | 현재 (ReactNode) | 변환 후 (DividerConfig) |
|--------|-------------------|------------------------|
| Modern sectionDivider | `<div className="h-px bg-zinc-200 mx-8 md:mx-12" />` | `{ type: 'horizontal-line', colorClass: 'bg-zinc-200', marginClass: 'mx-8 md:mx-12' }` |
| Minimal sectionDivider | `<div className="flex justify-center py-4"><div className="h-12 w-px bg-stone-200" /></div>` | `{ type: 'vertical-line', colorClass: 'bg-stone-200', heightClass: 'h-12', containerClass: 'flex justify-center py-4' }` |
| Modern postCoverDivider | `<div className="h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />` | `{ type: 'gradient-line', gradientClass: 'bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent' }` |

### 4-2. DecorationConfig

장식 요소 (인사말, 커버, 푸터).

```typescript
type DecorationType = 'none' | 'emoji' | 'symbol-with-lines' | 'diamond-with-lines' | 'text-label';

interface DecorationConfig {
  type: DecorationType;
  // emoji: 단순 이모지/심볼
  content?: string;          // "🌸", "❀", "🌿", "◇"
  contentClass?: string;     // "text-3xl md:text-4xl"
  // symbol-with-lines: ─── ❀ ─── 패턴 (Floral)
  lineClass?: string;        // "h-px w-12 bg-gradient-to-r from-transparent to-rose-200"
  lineReverseClass?: string; // "h-px w-12 bg-gradient-to-l from-transparent to-rose-200"
  symbolClass?: string;      // "text-rose-300 text-lg"
  // diamond-with-lines: ─── ◇ ─── 패턴 (Elegant)
  diamondClass?: string;     // "w-2 h-2 rotate-45 border border-amber-400/60"
  // text-label: "Greeting" uppercase (Modern)
  text?: string;
  textClass?: string;        // "text-xs tracking-[0.3em] text-emerald-600 uppercase mb-6"
  // 공통
  containerClass?: string;   // "flex items-center justify-center gap-3"
}
```

**현재 → 변환 예시:**

| 헬퍼 컴포넌트 | 변환 후 |
|---------------|---------|
| `FloralDecor` | `{ type: 'symbol-with-lines', content: '❀', symbolClass: 'text-rose-300 text-lg', lineClass: 'h-px w-12 bg-gradient-to-r from-transparent to-rose-200', ... }` |
| `ElegantDiamondDecor` | `{ type: 'diamond-with-lines', diamondClass: 'w-2 h-2 rotate-45 border border-amber-400/60', lineClass: 'h-px w-16 bg-gradient-to-r from-transparent to-amber-400/60', ... }` |
| `NaturalLeafDecor` | `{ type: 'emoji', content: '🌿', contentClass: 'text-xl opacity-60' }` |
| Modern greeting label | `{ type: 'text-label', text: 'Greeting', textClass: 'text-xs tracking-[0.3em] text-emerald-600 uppercase mb-6' }` |
| Classic 🌸 | `{ type: 'emoji', content: '🌸', contentClass: 'text-3xl md:text-4xl mb-6 md:mb-8' }` |

### 4-3. HeadingConfig

커스텀 헤딩 (섹션 제목 + 장식).

```typescript
type HeadingType = 'default' | 'with-decoration' | 'with-sub-label' | 'text-label';

interface HeadingConfig {
  type: HeadingType;
  text: string;              // "오시는 길", "Gallery", "마음 전하실 곳"
  headingClass?: string;     // override heading element style
  // with-decoration: 장식 + 제목 (Floral line heading, Natural leaf heading)
  decoration?: DecorationConfig;
  // with-sub-label: 소제목 위에 라벨 (Elegant)
  subLabel?: string;         // "Moments", "Gift", "Location"
  subLabelClass?: string;    // "text-xs tracking-[0.3em] text-amber-500 uppercase mb-2"
  // text-label: <p> 태그 라벨 (Modern)
  labelClass?: string;
  // Floral: lines flanking heading text
  lineClass?: string;
  lineReverseClass?: string;
  containerClass?: string;
}
```

**현재 → 변환 예시:**

| 헬퍼 컴포넌트 | 변환 후 |
|---------------|---------|
| `ElegantSubLabelHeading label="Moments">Gallery` | `{ type: 'with-sub-label', text: 'Gallery', subLabel: 'Moments', subLabelClass: 'text-xs tracking-[0.3em] text-amber-500 uppercase mb-2', headingClass: 'text-xl md:text-2xl font-serif text-slate-800' }` |
| `FloralLineHeading>오시는 길` | `{ type: 'with-decoration', text: '오시는 길', headingClass: 'font-serif text-xl text-rose-800', lineClass: 'h-px w-12 bg-gradient-to-r from-transparent to-rose-200', containerClass: 'flex items-center justify-center gap-3 mb-8' }` |
| `NaturalLeafHeading>Gallery` | `{ type: 'with-decoration', text: 'Gallery', decoration: { type: 'emoji', content: '🌿', contentClass: 'text-2xl opacity-60' }, headingClass: 'text-xl md:text-2xl font-light text-stone-800 mt-2' }` |
| Modern `<p>...>Gallery</p>` | `{ type: 'text-label', text: 'Gallery', labelClass: 'text-xs tracking-[0.3em] text-emerald-600 uppercase mb-10' }` |

### 4-4. AnimationConfig

함수/객체를 프리셋 기반 데이터로 변환.

```typescript
type AnimationPresetId = 'fade' | 'slide-x-left' | 'slide-x-right' | 'slide-y' | 'scale' | 'fade-scale';

interface AnimationConfig {
  preset: AnimationPresetId;
  duration?: number;         // default 0.5
  delay?: number;            // base delay
  delayPerItem?: number;     // gallery: delay = base + index * delayPerItem
}
```

**프리셋 → framer-motion 매핑:**

```typescript
// lib/templates/resolvers.ts

const ANIMATION_PRESETS: Record<AnimationPresetId, { initial: object; whileInView: object }> = {
  'fade':           { initial: { opacity: 0 },                  whileInView: { opacity: 1 } },
  'slide-x-left':   { initial: { opacity: 0, x: -20 },          whileInView: { opacity: 1, x: 0 } },
  'slide-x-right':  { initial: { opacity: 0, x: 20 },           whileInView: { opacity: 1, x: 0 } },
  'slide-y':        { initial: { opacity: 0, y: 20 },            whileInView: { opacity: 1, y: 0 } },
  'scale':          { initial: { opacity: 0, scale: 0.95 },      whileInView: { opacity: 1, scale: 1 } },
  'fade-scale':     { initial: { opacity: 0, scale: 0.9 },       whileInView: { opacity: 1, scale: 1 } },
};

export function resolveAnimation(config: AnimationConfig, index?: number): object {
  const preset = ANIMATION_PRESETS[config.preset] ?? ANIMATION_PRESETS['fade'];
  const delay = (config.delay ?? 0) + (index !== undefined ? (index * (config.delayPerItem ?? 0.08)) : 0);
  return {
    ...preset,
    transition: { duration: config.duration ?? 0.5, delay },
  };
}
```

**현재 → 변환 예시:**

| 현재 | 변환 후 |
|------|---------|
| `galleryItemMotion: (i) => ({ initial: { opacity: 0, scale: 0.9 }, whileInView: { opacity: 1, scale: 1 }, transition: { delay: i * 0.1 } })` | `galleryItemAnimation: { preset: 'fade-scale', delayPerItem: 0.1 }` |
| `groomMotion: { initial: { opacity: 0, x: -20 }, whileInView: { opacity: 1, x: 0 } }` | `groomAnimation: { preset: 'slide-x-left' }` |
| `brideMotion: { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, transition: { delay: 0.1 } }` | `brideAnimation: { preset: 'slide-y', delay: 0.1 }` |

### 4-5. CoverConfig

각 템플릿 파일의 커버 JSX를 파라미터로 변환.

```typescript
type CoverLayout = 'center' | 'bottom-left';

interface CoverConfig {
  layout: CoverLayout;
  // 이미지 처리
  imageOpacity: number;      // 20, 30, 40, 100
  imageGrayscale?: boolean;  // Minimal only
  // 그래디언트 오버레이
  gradient: {
    direction: string;       // "to-b", "to-t"
    stops: string;           // "from-transparent via-white/50 to-white"
  } | null;
  noImageBg?: string;        // 이미지 없을 때 배경 (Modern: "bg-gradient-to-br from-zinc-800 to-zinc-900")
  // "Wedding Invitation" 라벨
  invitationLabel: {
    text: string;
    class: string;
  };
  // 이름 표시
  nameClass: string;
  ampersandClass: string;
  ampersandDecoration?: DividerConfig;  // Modern: "&" 좌우 라인
  // 날짜/장소
  infoClass: string;
  // 장식
  topDecoration?: DecorationConfig;
  // 이름 컨테이너 (Floral: glass-card)
  nameContainer?: { class: string } | null;
  // 애니메이션
  contentAnimation: AnimationConfig;
  contentClass: string;
}
```

**6개 커버 차이점 요약:**

| 항목 | Classic | Modern | Minimal | Floral | Elegant | Natural |
|------|---------|--------|---------|--------|---------|---------|
| layout | center | bottom-left | center | center | center | center |
| imageOpacity | 40 | 100 | 20 | 30 | 30 | 40 |
| grayscale | - | - | true | - | - | - |
| gradient stops | `via-white/50 to-white` | `from-zinc-900/80 via-zinc-900/30` | - | `from-rose-50/60` | `from-slate-900/20` | `from-stone-50/50` |
| noImageBg | - | `from-zinc-800 to-zinc-900` | - | - | - | - |
| nameFont | serif 3xl | bold 5xl | light 3xl | serif 3xl | serif 4xl | light 4xl |
| ampersand | text only | lines + text | text only | text only | text only | text only |
| topDecoration | ✨ emoji | - | - | 🌸+🌺 | ✦ diamond | 🌿 |
| nameContainer | - | - | - | glass-card | - | - |
| animation | slide-y | slide-x-left | fade | scale | slide-y | scale |

### 4-6. FooterConfig

```typescript
type FooterLayout = 'centered' | 'flex-between';

interface FooterConfig {
  layout: FooterLayout;
  containerClass: string;
  bgClass?: string;          // Elegant: "bg-slate-800"
  borderClass?: string;      // Classic: "border-t border-amber-100"
  nameClass: string;         // 이름 텍스트 스타일
  linkClass: string;         // Cuggu 링크 스타일
  topDecoration?: DecorationConfig;  // Floral/Elegant/Natural/Minimal
}
```

### 4-7. 완전한 SerializableTheme

현재 `TemplateTheme`에서 아래 필드만 타입 변경. 나머지 ~30개 string 필드는 그대로:

```typescript
export interface SerializableTheme {
  id: string;

  // ── 기존 string 필드들 (변경 없음) ──
  containerBg: string;
  sectionPadding: string;
  contentMaxWidth: string;
  galleryMaxWidth: string;
  headingClass: string;
  bodyText: string;
  nameClass: string;
  labelClass: string;
  cardClass: string;
  accountCardClass: string;
  iconColor: string;
  accentColor: string;
  sideLabel: string;
  phoneLinkClass: string;
  accountTypeLabel: string;
  accountName: string;
  accountDetail: string;
  accountHolder: string;
  noticeBg: string;
  mapInfoBg: string;
  transportCard: string;
  sectionBg: Partial<Record<string, string>>;
  greetingMaxWidth: string;
  greetingAlign: string;
  galleryGap: string;
  galleryItemClass: string;
  galleryHover: string;
  parentsGrid: string;
  parentsCardWrapper?: string;
  parentsRoleLabel?: boolean;
  parentsFamilyNameClass?: string;
  accountsSpacing: string;
  accountCardsSpacing: string;
  cardLabelClass: string;
  cardValueClass: string;
  cardSubTextClass: string;
  noticeTextClass: string;
  transportLabelClass: string;
  transportTextClass: string;
  ceremonyCentered?: boolean;
  ceremonyDateLabel?: string;
  ceremonyVenueLabel?: string;
  mapVenueNameClass: string;
  mapAddressClass: string;

  // ── ReactNode → 직렬화 가능 타입으로 변경 ──
  greetingDecorTop?: DecorationConfig;     // was ReactNode
  greetingDecorBottom?: DecorationConfig;  // was ReactNode
  galleryItemAnimation: AnimationConfig;   // was (index) => object
  groomAnimation: AnimationConfig;         // was object
  brideAnimation: AnimationConfig;         // was object
  sectionDivider?: DividerConfig;          // was ReactNode
  postCoverDivider?: DividerConfig;        // was ReactNode
  accountsDivider?: DividerConfig;         // was ReactNode
  parentsHeading?: HeadingConfig;          // was ReactNode
  ceremonyHeading?: HeadingConfig;         // was ReactNode
  mapHeading?: HeadingConfig;              // was ReactNode
  galleryHeading?: HeadingConfig;          // was ReactNode
  accountsHeading?: HeadingConfig;         // was ReactNode

  // ── 신규: 커버/푸터 파라미터화 ──
  cover: CoverConfig;
  footer: FooterConfig;
}
```

---

## 5. 렌더러 컴포넌트

### 5-1. DividerRenderer

```typescript
// components/templates/DividerRenderer.tsx
export function DividerRenderer({ config }: { config?: DividerConfig }) {
  if (!config || config.type === 'none') return null;

  if (config.type === 'gradient-line') {
    return <div className={`h-px ${config.gradientClass}`} />;
  }
  if (config.type === 'vertical-line') {
    return (
      <div className={config.containerClass}>
        <div className={`w-px ${config.heightClass} ${config.colorClass}`} />
      </div>
    );
  }
  // horizontal-line
  return <div className={`h-px ${config.colorClass} ${config.widthClass ?? ''} ${config.marginClass ?? ''}`} />;
}
```

### 5-2. DecorationRenderer

```typescript
// components/templates/DecorationRenderer.tsx
export function DecorationRenderer({ config }: { config?: DecorationConfig }) {
  if (!config || config.type === 'none') return null;

  switch (config.type) {
    case 'emoji':
      return <div className={config.contentClass}>{config.content}</div>;
    case 'symbol-with-lines':
      return (
        <div className={config.containerClass ?? 'flex items-center justify-center gap-3'}>
          <div className={config.lineClass} />
          <span className={config.symbolClass}>{config.content}</span>
          <div className={config.lineReverseClass} />
        </div>
      );
    case 'diamond-with-lines':
      return (
        <div className={config.containerClass ?? 'flex items-center justify-center gap-4'}>
          <div className={config.lineClass} />
          <div className={config.diamondClass} />
          <div className={config.lineReverseClass} />
        </div>
      );
    case 'text-label':
      return <p className={config.textClass}>{config.text}</p>;
  }
}
```

### 5-3. HeadingRenderer

```typescript
// components/templates/HeadingRenderer.tsx
export function HeadingRenderer({ config, defaultClass }: { config?: HeadingConfig; defaultClass: string }) {
  if (!config) return null;

  switch (config.type) {
    case 'default':
      return <h2 className={config.headingClass ?? defaultClass}>{config.text}</h2>;
    case 'with-decoration':
      if (config.lineClass) {
        // Floral: lines flanking heading
        return (
          <div className={config.containerClass}>
            <div className={config.lineClass} />
            <h2 className={config.headingClass}>{config.text}</h2>
            <div className={config.lineReverseClass} />
          </div>
        );
      }
      // Natural: decoration above heading
      return (
        <div className="text-center mb-10">
          {config.decoration && <DecorationRenderer config={config.decoration} />}
          <h2 className={config.headingClass}>{config.text}</h2>
        </div>
      );
    case 'with-sub-label':
      return (
        <div className="text-center mb-10">
          <p className={config.subLabelClass}>{config.subLabel}</p>
          <h2 className={config.headingClass}>{config.text}</h2>
        </div>
      );
    case 'text-label':
      return <p className={config.labelClass}>{config.text}</p>;
  }
}
```

### 5-4. CoverSection

```typescript
// components/templates/CoverSection.tsx
// CoverConfig + Invitation data → 커버 JSX
// center / bottom-left 레이아웃 분기
// 이미지 opacity/grayscale, gradient overlay, 장식, 애니메이션
```

### 5-5. FooterSection

```typescript
// components/templates/FooterSection.tsx
// FooterConfig + Invitation data → 푸터 JSX
// centered / flex-between 레이아웃, 장식, Cuggu 링크
```

---

## 6. 테마 전환 + 템플릿 슬림화

### 6-1. 슬림화된 템플릿 (~15줄)

```typescript
// components/templates/ClassicTemplate.tsx
"use client";
import { classicTheme } from '@/lib/templates/serializable-themes';
import { BaseTemplate } from './BaseTemplate';
import type { Invitation } from '@/schemas/invitation';

interface ClassicTemplateProps {
  data: Invitation;
  isPreview?: boolean;
}

export function ClassicTemplate({ data, isPreview = false }: ClassicTemplateProps) {
  return <BaseTemplate data={data} theme={classicTheme} isPreview={isPreview} />;
}
```

6개 파일 모두 동일 패턴. 커버/푸터 JSX 완전 제거.

### 6-2. BaseTemplate 수정

```typescript
// components/templates/BaseTemplate.tsx (수정)
interface BaseTemplateProps {
  data: Invitation;
  theme: SerializableTheme;  // was TemplateTheme
  isPreview?: boolean;
  // coverSection, footerSection props 제거
}

export function BaseTemplate({ data, theme, isPreview }: BaseTemplateProps) {
  // ...
  return (
    <div className={theme.containerBg}>
      <CoverSection data={data} theme={theme} />         {/* 직접 렌더링 */}
      <DividerRenderer config={theme.postCoverDivider} /> {/* ReactNode → 렌더러 */}

      {renderedSections.map(({ id, node }, idx) => (
        <Fragment key={id}>
          {idx > 0 && <DividerRenderer config={theme.sectionDivider} />}
          {node}
        </Fragment>
      ))}

      <FooterSection data={data} theme={theme} isPreview={isPreview} />
    </div>
  );
}
```

### 6-3. Switch문 제거

```typescript
// app/inv/[id]/InvitationView.tsx (수정 후)
import { getTheme } from '@/lib/templates/serializable-themes';
import { BaseTemplate } from '@/components/templates/BaseTemplate';

export function InvitationView({ data }: InvitationViewProps) {
  const theme = getTheme(data.templateId);
  return (
    <main className="min-h-screen pb-16">
      <BaseTemplate data={data} theme={theme} />
      {/* ShareBar 등 */}
    </main>
  );
}
```

PreviewPanel.tsx도 동일하게 변경.

---

## 7. Tailwind Safelist 전략

### 문제

AI가 생성한 Tailwind 클래스는 소스 코드에 없으므로 빌드 시 purge됨.

### 해법: 제한된 어휘 (Constrained Vocabulary)

1. 6개 빌트인 테마에서 사용되는 **모든 클래스 추출** (기본 어휘)
2. 웨딩 관련 색상군의 **합리적 변형 확장** (rose, amber, emerald, stone, zinc, slate, pink, teal, purple, indigo, sky)
3. AI 시스템 프롬프트에서 **허용 클래스 목록 명시** → 닫힌 어휘 문제로 전환
4. AI 출력 후처리에서 **safelist 미포함 클래스 검증**

```typescript
// lib/templates/safelist.ts

// 빌트인 테마에서 자동 추출 + 색상 변형 확장
export const THEME_SAFELIST: string[] = [
  // 기존 테마 클래스 (자동 추출)
  'min-h-screen', 'bg-gradient-to-b', 'from-amber-50', 'via-white', 'to-amber-50',
  // ...

  // 색상 변형 확장 (AI 생성 유연성)
  // rose 50~900, amber 50~900, emerald 50~900, ...
  // text-{color}-{shade}, bg-{color}-{shade}, border-{color}-{shade}
  // opacity 변형: /30, /40, /50, /60, /70, /80
];

// tailwind.config.ts에서:
// safelist: THEME_SAFELIST
```

**예상 규모:** ~500-800 클래스, CSS 증가 ~30-50KB (gzip ~5-10KB)

---

## 8. AI 테마 생성

### 8-1. 의존성

```bash
pnpm add @anthropic-ai/sdk
```

### 8-2. Claude API tool_use 방식

```typescript
// lib/ai/theme-generation.ts

import Anthropic from '@anthropic-ai/sdk';
import { SerializableThemeSchema } from '@/schemas/theme';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { THEME_SYSTEM_PROMPT } from './theme-prompt';
import { THEME_SAFELIST } from '@/lib/templates/safelist';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function generateTheme(userPrompt: string): Promise<SerializableTheme> {
  const jsonSchema = zodToJsonSchema(SerializableThemeSchema);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: THEME_SYSTEM_PROMPT,
    tools: [{
      name: 'create_wedding_theme',
      description: 'Creates a complete wedding invitation theme with all styling configurations',
      input_schema: jsonSchema,
    }],
    tool_choice: { type: 'tool', name: 'create_wedding_theme' },
    messages: [{ role: 'user', content: userPrompt }],
  });

  const toolUse = response.content.find(block => block.type === 'tool_use');
  if (!toolUse) throw new Error('AI did not generate a theme');

  // 1. Zod 구조 검증
  const parsed = SerializableThemeSchema.parse(toolUse.input);

  // 2. Safelist 클래스 검증 (모든 string 필드의 각 클래스가 safelist에 존재하는지)
  validateThemeClasses(parsed, THEME_SAFELIST);

  return parsed;
}
```

### 8-3. 시스템 프롬프트 구조

```typescript
// lib/ai/theme-prompt.ts

export const THEME_SYSTEM_PROMPT = `
You are a wedding invitation theme designer for a Korean platform.
Create beautiful, cohesive themes by filling in the styling configuration.

## DESIGN RULES
1. Pick 1-2 base hues and use them consistently across all fields
2. Ensure text readability: dark text on light backgrounds, light text on dark backgrounds
3. Use only Tailwind classes from the ALLOWED LIST below
4. Animation presets available: fade, slide-x-left, slide-x-right, slide-y, scale, fade-scale
5. Decoration types: none, emoji, symbol-with-lines, diamond-with-lines, text-label
6. Divider types: none, horizontal-line, vertical-line, gradient-line
7. Cover layouts: center (most common), bottom-left (modern/bold style)
8. Footer layouts: centered (most common), flex-between (modern style)

## FIELD REFERENCE
[각 필드가 UI에서 어디에 쓰이는지 간단 설명]

## EXAMPLE THEMES
[Classic, Modern, Floral 3개 테마 전문]

## ALLOWED TAILWIND CLASSES
[safelist 전체 목록]
`;
```

### 8-4. API 엔드포인트

```typescript
// app/api/ai/theme/route.ts

// POST /api/ai/theme
// Body: { prompt: string }
// Response: { success: true, theme: SerializableTheme }

// 보안:
// - NextAuth 인증 필수
// - 레이트 리밋: 10회/일/유저 (Upstash Redis)
// - 크레딧 차감: 기존 aiCredits 시스템 재사용
// - Zod 검증 + safelist 클래스 검증
```

### 8-5. 비용 예상

- Claude Sonnet: ~$0.003/요청 (input ~2K tokens, output ~1.5K tokens)
- 레이트 리밋 10회/일 → 유저당 최대 $0.03/일

---

## 9. DB 저장 (MVP)

### `invitations.extendedData.customTheme`에 저장

스키마 마이그레이션 불필요. 기존 JSONB 필드 활용.

```typescript
// getTheme() 수정
export function getTheme(templateId: string, customTheme?: SerializableTheme): SerializableTheme {
  if (customTheme) return customTheme;
  return themes[templateId] ?? classicTheme;
}

// InvitationView에서:
const customTheme = data.extendedData?.customTheme as SerializableTheme | undefined;
const theme = getTheme(data.templateId, customTheme);
```

향후 `templates` 테이블에 `CUSTOM` 카테고리 추가하여 정식 저장소로 이전 가능.

---

## 10. 파일 구조 요약

### 새로 생성

```
lib/templates/
  types.ts                     # SerializableTheme + 서브타입 정의
  serializable-themes.ts       # 6개 빌트인 테마 (SerializableTheme)
  resolvers.ts                 # resolveAnimation()
  safelist.ts                  # Tailwind safelist

schemas/
  theme.ts                     # Zod 검증 스키마

components/templates/
  DividerRenderer.tsx           # DividerConfig → JSX
  DecorationRenderer.tsx        # DecorationConfig → JSX
  HeadingRenderer.tsx           # HeadingConfig → JSX
  CoverSection.tsx              # CoverConfig → 커버 JSX
  FooterSection.tsx             # FooterConfig → 푸터 JSX

lib/ai/
  theme-generation.ts           # Claude API 호출
  theme-prompt.ts               # 시스템 프롬프트 + 예시

app/api/ai/
  theme/route.ts                # POST 엔드포인트
```

### 수정

```
components/templates/BaseTemplate.tsx          # SerializableTheme 사용, cover/footer 직접 렌더링
components/templates/sections/*.tsx (7개)       # SerializableTheme + 렌더러
components/templates/ClassicTemplate.tsx 외 5개  # ~15줄로 슬림화
app/inv/[id]/InvitationView.tsx                # switch문 제거
components/editor/PreviewPanel.tsx             # switch문 제거
tailwind.config.ts                             # safelist 추가
lib/templates/themes.tsx                       # deprecated → re-export
```

### 삭제 (themes.tsx에서)

- `FloralDecor`, `ElegantDiamondDecor`, `NaturalLeafDecor`
- `NaturalLeafHeading`, `ElegantSubLabelHeading`, `FloralLineHeading`
- 기존 `TemplateTheme` 인터페이스

---

## 11. 구현 순서

```
Phase 1 (타입 시스템)  → Phase 2 (렌더러)  → Phase 3 (커버/푸터)  → Phase 4 (전환)
  types.ts               DividerRenderer      CoverSection            serializable-themes.ts
  resolvers.ts           DecorationRenderer   FooterSection           섹션 업데이트
  schemas/theme.ts       HeadingRenderer                              BaseTemplate 수정
                                                                      템플릿 슬림화
                                                                      switch문 제거
                                                                         ↓
                                                              Phase 5 (safelist)
                                                              Phase 6 (AI 생성)
                                                              Phase 7 (DB/UI 통합)
```

Phase 1~4: 순차적 (의존성), Phase 5~7: Phase 4 이후 병렬 가능.

---

## 12. 검증 방법

1. **타입 체크**: `npx tsc --noEmit` — Phase 4 완료 후
2. **시각적 회귀 테스트**: 6개 템플릿 before/after 스크린샷 비교
3. **AI 생성 테스트**: `curl -X POST /api/ai/theme -d '{"prompt":"dark luxury gold"}'`
4. **Safelist 검증**: AI 생성 테마 적용 시 스타일 정상 렌더링 확인
5. **번들 크기**: `next build` 후 CSS 크기 증가량 확인 (safelist 추가)

---

## 13. 리스크 & 대응

| 리스크 | 대응 |
|--------|------|
| 시각적 회귀 (6개 템플릿) | Phase 4 완료 후 Playwright 스크린샷 비교 |
| AI가 safelist 밖 클래스 생성 | 후처리에서 검증 + 시스템 프롬프트에 허용 목록 명시 |
| CSS 번들 사이즈 증가 | safelist 규모 모니터링, 50KB 이상이면 범위 축소 |
| CoverConfig 복잡도 (Modern 레이아웃) | center/bottom-left 2개 서브컴포넌트로 분리 가능 |
| Anthropic API 비용 | 레이트 리밋 (10회/일) + 크레딧 시스템으로 제어 |
