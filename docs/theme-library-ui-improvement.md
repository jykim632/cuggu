# 테마 라이브러리 UI 개선

## Context
현재 "내 테마 라이브러리"는 단순 텍스트 row 리스트(`space-y-2`)로 모든 테마를 나열. 테마가 5개 이상이면 길어지고, 어떤 테마인지 시각적 구분이 안 됨. 컬러 미리보기 카드 + 최근 4개 + 더보기 방식으로 개선.

## 변경 사항

### 1. 새 파일: `lib/tailwind-color-map.ts` (~120줄)

Tailwind 클래스 문자열에서 hex 색상을 추출하는 유틸리티.

- `TAILWIND_COLORS` 상수: 22개 컬러 패밀리 × 11 shade = ~242 엔트리 (safelist.ts의 `WEDDING_COLORS`와 동일 범위)
- `twClassToHex(cls)`: `"text-rose-500"` → `"#f43f5e"`, `"bg-amber-50"` → `"#fffbeb"` 변환
  - 정규식: `/^(?:text|bg|border|from|via|to|ring)-([a-z]+)-(\d+)(?:\/\d+)?$/`
  - opacity suffix(`/30`) 무시하고 base 색상 반환
  - `bg-white`, `text-black` 등 특수 케이스 처리
- `extractThemeColors(theme)`: 테마 객체에서 3~5개 대표 hex 색상 추출
  - 추출 우선순위: `containerBg` → `iconColor` → `accentColor` → `headingClass` → `cardClass` → `bodyText` → `cover.nameClass`
  - 중복 제거, 최대 5개 반환

### 2. 수정: `components/editor/tabs/TemplateTab.tsx`

**새 인라인 컴포넌트 2개 추가:**

**`ThemeColorStrip`** (~15줄): 테마 컬러 팔레트를 가로 스트립으로 표시
```
[amber-50][amber-600][gray-800][amber-100][gray-700]  ← flex h-1.5, 각 색상 flex-1
```
- 색상 0개면 neutral gradient fallback

**`ThemeCard`** (~55줄): 기존 row를 카드로 교체
```
┌──────────────────────────────────┐
│ [===== color strip (1.5h) =====] │
│                                  │
│ "라벤더색 로맨틱한 봄 웨딩..."      │
│ 3시간 전  [빠른]  [일부 미적용]    │
│ ─────────────────────────────── │
│ [적용]                  [trash]  │
└──────────────────────────────────┘
```
- 적용 중: `border-violet-300 bg-violet-50/50 ring-1 ring-violet-200`
- 미적용: `border-stone-200 hover:border-stone-300 bg-white`
- 프롬프트: `line-clamp-2` (기존 `truncate`보다 여유 있게)

**라이브러리 섹션 변경:**

- `showAllThemes` state 추가
- 기본 4개만 표시, "더보기 (N개 더)" / "접기" 토글
- `space-y-2` → `space-y-3` (카드 간격)

## 파일 목록

| 파일 | 작업 |
|------|------|
| `lib/tailwind-color-map.ts` | **신규** - TW 클래스→hex 매핑 + 테마 색상 추출 |
| `components/editor/tabs/TemplateTab.tsx` | **수정** - ThemeColorStrip, ThemeCard 추가, 라이브러리 섹션 교체, 더보기 토글 |

## 안 하는 것
- 별도 컴포넌트 파일 분리 (한 곳에서만 사용)
- Framer Motion expand/collapse 애니메이션 (과잉)
- 페이지네이션 / 가상 스크롤 (최대 20개, 불필요)
- 미니 목업 렌더링 (복잡도 대비 효용 낮음)

## 검증
1. dev 서버에서 에디터 → 템플릿 탭 → 테마 라이브러리 확인
2. 테마 생성 후 카드에 컬러 스트립이 테마 색상과 일치하는지 확인
3. 5개 이상일 때 더보기/접기 동작 확인
4. 적용/삭제 기능 정상 동작 확인
