# 섹션 간격 축소

> **날짜**: 2026-02-09
> **상태**: 구현 완료
> **커밋**: `3e722f4` (develop, squash merge)
> **관련 파일**: `lib/templates/themes.ts`, `components/templates/sections/GreetingSection.tsx`, `lib/ai/theme-prompt.ts`

---

## 배경

청첩장 프리뷰에서 섹션 간 간격이 과도하게 넓어 콘텐츠가 희소해 보이는 문제.
간격이 **3가지 레이어에서 누적**되고 있었음:

| 레이어 | 위치 | 문제 |
|--------|------|------|
| `sectionPadding` | 각 섹션의 `py-*` | 인접 섹션 간 96~128px 공백 (모바일) |
| `GreetingSection minHeight` | 컴포넌트 인라인 스타일 | `100vh`로 인사말이 전체 화면 차지 |
| AI 프롬프트 | `theme-prompt.ts` | 간격 가이드라인 부재 → AI가 예제 따라 큰 값 생성 |

---

## 논의 및 고민

- AI 테마 생성 시 `sectionPadding`은 `SerializableTheme` 필드라 AI가 값을 채우긴 함
- 그러나 예제 테마(Classic, Floral)가 큰 값을 제공하고 있어서 AI도 비슷한 큰 값 생성
- GreetingSection의 100vh는 테마가 아닌 컴포넌트에 하드코딩되어 테마로 제어 불가
- `py-8 md:py-12`(Classic/Floral) vs `py-10 md:py-16`(나머지) 두 단계로 차등 적용

---

## 결정 사항

### 1. sectionPadding 축소 (6개 테마 전체)

| 테마 | 변경 전 | 변경 후 | 모바일 간격 |
|------|---------|---------|------------|
| Classic | `py-12 md:py-20` | `py-8 md:py-12` | 96px → 64px |
| Modern | `py-16 md:py-24` | `py-10 md:py-16` | 128px → 80px |
| Minimal | `py-16 md:py-24` | `py-10 md:py-16` | 128px → 80px |
| Floral | `py-14 md:py-20` | `py-8 md:py-12` | 112px → 64px |
| Elegant | `py-16 md:py-24` | `py-10 md:py-16` | 128px → 80px |
| Natural | `py-16 md:py-24` | `py-10 md:py-16` | 128px → 80px |

### 2. GreetingSection 100vh 제거

`style={{ minHeight: 'var(--screen-height, 100vh)' }}` 삭제 → 콘텐츠 높이에 맞게 렌더링

### 3. AI 프롬프트 간격 가이드라인 추가

```
sectionPadding: Use compact values like "py-8 md:py-12 px-6" or "py-10 md:py-16 px-6".
Do NOT use py-16+ on mobile.
```

### 4. Safelist

변경된 클래스(`py-8`, `py-10`, `md:py-12`, `md:py-16`) 모두 기존 safelist에 이미 포함 → 추가 작업 불필요

---

## 수정 파일

| 파일 | 변경 |
|------|------|
| `lib/templates/themes.ts` | 6개 테마 `sectionPadding` 축소 |
| `components/templates/sections/GreetingSection.tsx` | `minHeight: 100vh` 제거 |
| `lib/ai/theme-prompt.ts` | spacing 가이드라인 추가 |

---

## 작업 방식: git worktree

이번 작업에서 처음으로 `git worktree`를 사용하여 분리 작업 진행.

```
develop (메인)     →  cuggu/
fix/section-spacing → cuggu-spacing/ (worktree)
```

1. `git worktree add ../cuggu-spacing -b fix/section-spacing develop`
2. worktree에서 수정 + 커밋
3. develop에서 `git merge --squash fix/section-spacing`
4. `git worktree remove --force` + `git branch -D`

> squash merge 시 `-d`가 아닌 `-D`로 브랜치 삭제 필요 (커밋 해시가 달라 fully merged로 안 잡힘)

---

## 검증

- [x] TypeScript 타입 체크 통과 (기존 테스트 파일 에러만 있음, 무관)
- [ ] 에디터 프리뷰에서 6개 테마 간격 시각 확인
- [ ] GreetingSection 콘텐츠 높이 맞춤 확인
- [ ] AI 테마 생성 시 적절한 sectionPadding 값 확인

---

## 남은 것 / 다음 액션

- 프리뷰에서 실제 간격 확인 후 미세 조정 가능 (현재 값이 너무 좁으면 py-10/py-12로 상향)
- AI 테마 생성 테스트 시 sectionPadding 값 모니터링
- `git worktree` 가이드 문서 별도 작성 완료 (`docs/git-worktree-guide.md`)

---

## 참고: 간격 구조

```
┌─────────────────────┐
│  Section A           │
│  (content)           │
│  py-bottom ──────── │ ← sectionPadding 하단
├─────────────────────┤
│  sectionDivider      │ ← 테마별 optional
├─────────────────────┤
│  py-top ──────────  │ ← sectionPadding 상단
│  Section B           │
│  (content)           │
└─────────────────────┘

실제 간격 = Section A의 py-bottom + Section B의 py-top
```
