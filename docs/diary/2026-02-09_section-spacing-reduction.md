# 섹션 간격 축소 계획

> **날짜**: 2026-02-09
> **상태**: 계획 완료 / 구현 대기
> **관련 파일**: `lib/templates/themes.ts`, `components/templates/sections/GreetingSection.tsx`, `lib/ai/theme-prompt.ts`, `lib/templates/safelist.ts`

---

## 배경 및 문제

청첩장 프리뷰에서 섹션 간 간격이 과도하게 넓어 콘텐츠가 희소해 보이는 문제 발견.

### 원인 분석

간격은 **3가지 레이어**에서 누적됨:

| 레이어 | 위치 | 현재 값 | 효과 |
|--------|------|---------|------|
| `sectionPadding` | 각 섹션의 `py-*` | `py-12` ~ `py-16` (모바일) | 인접 섹션 간 96~128px 공백 |
| `GreetingSection minHeight` | 컴포넌트 인라인 스타일 | `100vh` | 인사말이 전체 화면 차지 |
| AI 프롬프트 | `theme-prompt.ts` | 가이드라인 부재 | AI가 예제 따라 큰 값 생성 |

### 현재 sectionPadding 값

| 테마 | sectionPadding | 모바일 섹션간 간격 | 데스크탑 섹션간 간격 |
|------|---------------|-------------------|---------------------|
| Classic | `py-12 md:py-20 px-6` | 96px | 160px |
| Modern | `py-16 md:py-24 px-8 md:px-12` | 128px | 192px |
| Minimal | `py-16 md:py-24 px-6` | 128px | 192px |
| Floral | `py-14 md:py-20 px-6` | 112px | 160px |
| Elegant | `py-16 md:py-24 px-6` | 128px | 192px |
| Natural | `py-16 md:py-24 px-6` | 128px | 192px |

---

## 결정 사항

### 1. sectionPadding 축소 (6개 테마 전체)

| 테마 | 변경 전 | 변경 후 | 모바일 간격 변화 |
|------|---------|---------|-----------------|
| Classic | `py-12 md:py-20 px-6` | `py-8 md:py-12 px-6` | 96px → 64px |
| Modern | `py-16 md:py-24 px-8 md:px-12` | `py-10 md:py-16 px-8 md:px-12` | 128px → 80px |
| Minimal | `py-16 md:py-24 px-6` | `py-10 md:py-16 px-6` | 128px → 80px |
| Floral | `py-14 md:py-20 px-6` | `py-8 md:py-12 px-6` | 112px → 64px |
| Elegant | `py-16 md:py-24 px-6` | `py-10 md:py-16 px-6` | 128px → 80px |
| Natural | `py-16 md:py-24 px-6` | `py-10 md:py-16 px-6` | 128px → 80px |

### 2. GreetingSection 100vh 제거

- `components/templates/sections/GreetingSection.tsx:17`
- `style={{ minHeight: 'var(--screen-height, 100vh)' }}` 인라인 스타일 삭제
- 인사말 섹션이 콘텐츠 크기에 맞게 자연스럽게 렌더링

### 3. AI 테마 프롬프트 간격 가이드라인 추가

- `lib/ai/theme-prompt.ts`의 `KEY FIELDS EXPLAINED` 섹션에 spacing 가이드 추가
- AI가 `py-16+` 같은 과도한 값을 생성하지 않도록 유도

### 4. Safelist 확인

- `lib/templates/safelist.ts`에 변경된 padding 클래스 포함 여부 확인
- 누락 시 추가 (`py-8`, `py-10`, `md:py-12`, `md:py-16`)

---

## 수정 대상 파일

| 파일 | 변경 내용 |
|------|----------|
| `lib/templates/themes.ts` | 6개 테마 `sectionPadding` 값 수정 |
| `components/templates/sections/GreetingSection.tsx` | `minHeight: 100vh` 인라인 스타일 제거 |
| `lib/ai/theme-prompt.ts` | spacing 가이드라인 문구 추가 |
| `lib/templates/safelist.ts` | 필요시 padding 클래스 추가 |

---

## 검증 계획

- [ ] `npm run build` 빌드 통과
- [ ] 에디터 프리뷰에서 6개 테마 전환하며 간격 시각 확인
- [ ] GreetingSection이 콘텐츠 높이에 맞게 축소되는지 확인
- [ ] AI 테마 생성 시 적절한 sectionPadding 값이 나오는지 확인

---

## 참고: 간격 구조

```
┌─────────────────────┐
│  Section A           │
│  (content)           │
│  py-bottom ──────── │ ← sectionPadding 하단
├─────────────────────┤
│  sectionDivider      │ ← 테마별 optional (Classic은 없음)
├─────────────────────┤
│  py-top ──────────  │ ← sectionPadding 상단
│  Section B           │
│  (content)           │
└─────────────────────┘

실제 간격 = Section A의 py-bottom + Section B의 py-top
```
