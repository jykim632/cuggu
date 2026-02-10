# AI 테마 다양성 개선 설계서

## 문제 정의

AI 생성 테마가 구조적으로 동일한 결과물만 생성됨.

**근본 원인**:
1. **섹션 레이아웃 하드코딩**: 갤러리는 항상 2x3 그리드, 부모님은 항상 100vh — 테마가 레이아웃을 제어할 수 없음
2. **프롬프트 고정화**: 비슷한 JSON 예시 2개를 통째로 제공 → AI가 복사 후 색상만 변경
3. **구조적 다양성 메커니즘 부재**: 카테고리 힌트만 제공하고 레이아웃 조합을 강제하지 않음

**목표**: 테마가 색상뿐 아니라 섹션 레이아웃까지 제어하여 구조적으로 다른 테마 생성

---

## Step 1: 테마 스키마 레이아웃 필드 추가

**파일**: `schemas/theme.ts`, `lib/templates/types.ts`

### 추가 필드 (모두 optional — 하위호환 유지)

| 필드 | 타입 | 기본값(미지정 시) | 설명 |
|------|------|-------------------|------|
| `galleryLayout` | `'grid-2' \| 'grid-3' \| 'grid-2-1' \| 'single-column' \| 'masonry'` | 기존 grid-2 md:grid-3 | 갤러리 그리드 레이아웃 |
| `parentsLayout` | `'side-by-side' \| 'stacked' \| 'compact' \| 'cards'` | side-by-side | 부모님 섹션 배치 |
| `parentsFullHeight` | `boolean` | `true` | 부모님 섹션 100vh 적용 여부 |
| `greetingLayout` | `'centered' \| 'left-aligned' \| 'quote-style'` | centered | 인사말 정렬/스타일 |
| `ceremonyLayout` | `'cards' \| 'centered' \| 'inline' \| 'timeline'` | cards | 예식 정보 레이아웃 |
| `sectionSpacing` | `'compact' \| 'normal' \| 'spacious'` | normal | 섹션 간 간격 |

### 설계 원칙
- 모든 필드 `.optional()` → 기존 테마/커스텀 테마 영향 없음
- 미지정 시 현재 동작 그대로 유지
- `ceremonyCentered: boolean`과의 하위호환: `ceremonyCentered: true` → `ceremonyLayout: 'centered'`로 매핑

---

## Step 2: 섹션 컴포넌트 레이아웃 분기

### GallerySection.tsx

현재: `grid grid-cols-2 md:grid-cols-3` 하드코딩

변경: `theme.galleryLayout` 기반 동적 전환

| 값 | CSS/동작 | 설명 |
|----|----------|------|
| (미지정) | `grid-cols-2 md:grid-cols-3` | 기존 동작 유지 |
| `grid-2` | `grid-cols-2` | 2열 고정 |
| `grid-3` | `grid-cols-3` | 3열 고정 |
| `grid-2-1` | `grid-cols-2` + 3번째마다 `col-span-2` | 매거진 스타일 |
| `single-column` | `grid-cols-1` | 1열 풀너비 (시네마틱) |
| `masonry` | `columns-2 md:columns-3` | 핀터레스트 스타일 |

### ParentsSection.tsx

| 변경 포인트 | 조건 | 동작 |
|-------------|------|------|
| fullHeight | `theme.parentsFullHeight !== false` | 100vh minHeight 적용 |
| `stacked` | `parentsLayout: 'stacked'` | 세로 배치 (신랑 위, 신부 아래) |
| `compact` | `parentsLayout: 'compact'` | 풀하이트 제거, 간결한 인라인 |
| `cards` | `parentsLayout: 'cards'` | parentsCardWrapper 강제 적용 |

### GreetingSection.tsx

| 값 | 동작 |
|----|------|
| `centered` (기본) | 기존 중앙 정렬 |
| `left-aligned` | `text-left` + 좌측 정렬 |
| `quote-style` | 큰 따옴표 + italic/serif 스타일링 |

### CeremonySection.tsx

기존 `ceremonyCentered: boolean` → `ceremonyLayout` enum 확장

| 값 | 동작 |
|----|------|
| `cards` (기본) | 기존 카드 레이아웃 |
| `centered` | 중앙 정렬 (= `ceremonyCentered: true`) |
| `inline` | 날짜/장소 한 줄 컴팩트 |
| `timeline` | 세로 타임라인 + 도트/라인 |

---

## Step 3: AI 프롬프트 개편

**파일**: `lib/ai/theme-prompt.ts`

### 변경 사항

| 항목 | Before | After |
|------|--------|-------|
| JSON 예시 | classicTheme, floralTheme 전체 JSON 2개 | **제거** — 필드별 간단한 레퍼런스만 유지 |
| 레이아웃 가이드 | 없음 | 사용 가능한 레이아웃 옵션 목록 제공 |
| 디자인 제약 | "Korean wedding aesthetic", "1-2 base hues" | 완화 — 색상/스타일 자유도 극대화 |
| 다양성 지시 | 없음 | 구조적 유니크성 명시적 요구 |

### 프롬프트에 포함할 레이아웃 옵션

```
## LAYOUT OPTIONS (choose freely, create unique combinations)
- galleryLayout: grid-2, grid-3, grid-2-1, single-column, masonry
- parentsLayout: side-by-side, stacked, compact, cards
- parentsFullHeight: true/false
- greetingLayout: centered, left-aligned, quote-style
- ceremonyLayout: cards, centered, inline, timeline
- sectionSpacing: compact, normal, spacious
- cover.layout: center, bottom-left

Mix these freely. No two themes should use the same combination.
```

### 다양성 강제 지시문

```
IMPORTANT: Every theme you create must be structurally unique.
Vary galleryLayout, parentsLayout, ceremonyLayout, cover.layout across generations.
Do NOT default to the same patterns repeatedly.
```

---

## Step 4: 랜덤 레이아웃 시드 주입

**파일**: `lib/ai/theme-generation.ts`

기존 카테고리 힌트 대신 **레이아웃 조합 시드**를 랜덤 생성하여 AI에게 전달:

```typescript
const layoutSeed = {
  galleryLayout: pick(['grid-2', 'grid-3', 'grid-2-1', 'single-column', 'masonry']),
  parentsLayout: pick(['side-by-side', 'stacked', 'compact', 'cards']),
  ceremonyLayout: pick(['cards', 'centered', 'inline', 'timeline']),
};
// → "이 조합을 기반으로 어울리는 테마를 만들어" 형태로 전달
```

- 카테고리 사전 정의 없이 매번 다른 구조 보장
- AI는 주어진 시드에 맞는 색상/폰트/장식을 자유롭게 결정

---

## Step 5: 빌트인 6개 테마 구조 차별화

**파일**: `lib/templates/themes.ts`

| 테마 | galleryLayout | parentsLayout | parentsFullHeight | cover.layout | ceremonyLayout | greetingLayout |
|------|--------------|---------------|-------------------|--------------|----------------|----------------|
| classic | (default) | side-by-side | true | center | cards | centered |
| modern | grid-3 | stacked | false | bottom-left | inline | left-aligned |
| minimal | single-column | compact | false | center | centered | quote-style |
| floral | masonry | cards | true | center | cards | centered |
| elegant | grid-2-1 | side-by-side | true | center | timeline | centered |
| natural | grid-2 | cards | false | center | cards | centered |

---

## Step 6: Safelist & Enum 보정

**파일**: `lib/ai/theme-generation.ts`, `lib/templates/safelist.ts`

### ENUM_CORRECTIONS 추가

AI가 흔히 잘못 쓰는 변형 매핑:
- `side_by_side` → `side-by-side`
- `single_column` → `single-column`
- `left_aligned` → `left-aligned`
- `quote_style` → `quote-style`
- `grid_2_1` → `grid-2-1`

### ENUM_VALID_VALUES 추가

새 필드의 유효값 목록 등록 → AI 출력 자동 보정

### Safelist 추가

masonry 레이아웃용 Tailwind 클래스:
- `columns-2`, `columns-3`
- `space-y-3`
- `break-inside-avoid`

---

## 수정 파일 목록

| 파일 | 변경 내용 |
|------|----------|
| `schemas/theme.ts` | 6개 레이아웃 enum 필드 추가 |
| `lib/templates/types.ts` | TypeScript 인터페이스 동기화 |
| `components/templates/sections/GallerySection.tsx` | 갤러리 레이아웃 분기 |
| `components/templates/sections/ParentsSection.tsx` | 부모님 레이아웃 + fullHeight 분기 |
| `components/templates/sections/GreetingSection.tsx` | 인사말 레이아웃 분기 |
| `components/templates/sections/CeremonySection.tsx` | 세레모니 레이아웃 확장 |
| `lib/ai/theme-prompt.ts` | 프롬프트 전면 개편 |
| `lib/ai/theme-generation.ts` | 랜덤 시드 + enum 보정 |
| `lib/templates/themes.ts` | 빌트인 테마 구조 차별화 |
| `lib/templates/safelist.ts` | masonry 클래스 추가 |

---

## 검증 체크리스트

- [ ] **하위호환**: 새 필드 미지정 시 기존 6개 테마 렌더링 정상 동작
- [ ] **AI 다양성**: 동일 프롬프트 3-4회 생성 → 구조적 차이 확인
- [ ] **TypeScript 빌드**: `npx tsc --noEmit` 통과
- [ ] **Safelist**: masonry 클래스 포함, `safelist_failed` 미발생
- [ ] **Enum 보정**: AI가 `side_by_side` 등 변형 출력 시 자동 매핑 확인

---

## 기대 효과

- **Before**: 색상만 다른 구조적으로 동일한 테마 반복 생성
- **After**: 갤러리 레이아웃, 부모님 섹션 배치, 세레모니 형태, 간격까지 매번 다른 조합 → 사용자에게 실질적 선택지 제공
