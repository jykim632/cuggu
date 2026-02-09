# 2026-02-09 에디터 메뉴 구조 개선

## 작업한 내용

에디터 사이드바 메뉴 구성을 UX/비즈니스 관점에서 전방위 분석하고, 문제점 3가지를 개선.

### 1. RSVP 독립 탭 분리
- `SettingsTab`에 묻혀있던 RSVP(참석 여부 수집)를 독립 탭으로 추출
- 새 `RsvpTab.tsx` 생성, optional 그룹에 toggleable로 배치
- `SectionPanel`, `Sidebar`, `EditorPanel`, `tabs.ts`, `invitation.ts` 연동

### 2. 갤러리 탭 AI 기능 노출 강화
- description: "사진 업로드 및 관리" → "사진 업로드 · AI 사진 생성"
- `EditorTab` 인터페이스에 `badge` 필드 추가
- `SectionPanel`에서 갤러리 옆에 그라데이션 "AI" 뱃지 렌더링

### 3. D-Day 달력 스타일 위치 이동
- `VenueTab` 하단에 있던 D-Day 달력 스타일 선택기를 `SettingsTab`으로 이동
- 예식장 탭은 "정보 입력"에 집중, 표시 설정은 설정에서 관리

### 4. Turbopack 빌드 에러 수정 (보너스)
- `tailwind.config.ts`에서 `./lib/templates/safelist` import 시 Turbopack module resolve 실패
- 원인: Turbopack이 config 파일의 상대경로 import 체인을 resolve 못 하는 알려진 제한
- 해결: safelist 생성 로직을 tailwind.config.ts에 인라인, content에 `./lib/templates/*.ts` 추가
- `themes.tsx` → `themes.ts` 리네임 (JSX 미사용 파일)

## 왜 했는지

에디터 메뉴가 청첩장 제작 흐름에 최적화되어 있는지 점검이 필요했음. "만들다가 이탈하는 포인트"를 줄이고, 핵심 기능의 발견율을 높이는 게 목적.

## 논의/아이디어/고민

### 분석 과정
- Claude Explore 에이전트 2개로 에디터 구조 + 스키마/유저저니를 병렬 탐색
- Plan 에이전트로 UX/비즈니스 관점 분석
- 한국 모바일 청첩장 경쟁사(보닐, 오하루, 모두의청첩장) 비교

### 주요 발견
- **1~6번 탭 순서(템플릿→기본정보→예식장→인사말→갤러리→계좌)는 업계 표준과 완벽 일치** → 변경 불필요
- **RSVP만 경쟁사 대비 구조적으로 뒤처짐** → 경쟁사 모두 독립 탭
- **AI 사진은 유일한 차별점인데 사이드바에서 전혀 드러나지 않음** → 발견율 문제

### 고민했던 것들
- 인사말 탭이 너무 가벼운 거 아닌가? → 현재 위치(4번)가 "hard work 후 브레이커" 역할하므로 유지
- 템플릿을 첫 번째에 놓는 게 맞나? → 업계 표준이고, 시각적 흥미로 첫 인상 잡는 역할
- Settings를 더 쪼개야 하나? → RSVP만 빼면 충분히 경량화됨. 오버엔지니어링 방지

## 결정된 내용

- 7탭 → 8탭 (RSVP 분리)
- 데이터 모델 변경 없음. 순수 UI 레이어 변경
- safelist은 tailwind.config.ts 인라인으로 확정 (Turbopack 호환)
- `safelist.ts`는 AI 테마 검증용(`validateThemeClasses`)으로 유지

## 난이도/발견

- **난이도**: 메뉴 분석은 고민이 많았지만, 구현 자체는 단순 (코드 이동 위주)
- **발견**: Turbopack이 tailwind.config.ts의 상대경로 import를 resolve 못 하는 건 Next.js 16 특유의 문제. webpack에서는 문제없던 패턴
- **발견**: `themes.tsx`에 JSX가 없는데 `.tsx` 확장자 → jiti 로더도 혼란

## 남은 것

- 이전 세션 미커밋 파일들 (InvitationView, PreviewClient, TemplateTab, invitation-utils, package.json 등) 별도 정리 필요
- `safelist.ts`의 `THEME_SAFELIST`와 tailwind.config.ts 인라인 safelist 간 동기화 신경 써야 함 (색상 팔레트 추가 시 두 곳 수정)

## 다음 액션

- 미커밋 파일 정리/커밋
- 카카오톡 SDK 공유 기능 (`cuggu-jl6`) - 사업적으로 가장 급함
- 이미지 최적화 및 CDN 설정 (`cuggu-kgz`)

## 서랍메모

- safelist 이중관리 문제: 나중에 AI 테마 기능 본격화할 때 빌드 스크립트로 safelist.json 생성 → 양쪽에서 import하는 구조로 개선하면 좋겠음
- 에디터 메뉴 분석 문서 `docs/editor-menu-ux-analysis.md`에 경쟁사 비교표 포함해놨음. 나중에 투자/사업 문서에 활용 가능

## 내 질문 평가 및 피드백

사용자의 "메뉴 구성이 잘 되어있는지 확인해봐" 요청은 단순 코드 리뷰가 아니라 UX/비즈니스 전략 분석을 요구하는 것이었음. 에이전트 병렬 탐색으로 코드 구조를 빠르게 파악한 뒤 경쟁사 비교까지 포함한 분석 문서를 만든 건 좋았음. 다만 Turbopack 빌드 에러는 예상 못한 사이드퀘스트 — `require()`, 파일 분리 등 여러 시도를 거쳐서 인라인이 정답이라는 걸 찾는 데 시간이 좀 걸렸음.
