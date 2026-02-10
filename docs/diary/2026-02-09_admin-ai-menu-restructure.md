# 관리자 AI 메뉴 재구성 — 구현 로그

> 날짜: 2026-02-09
> 브랜치: `feat/ai-theme-generation`
> 커밋: `89678a6`
> 선행 작업: `2026-02-09_ai-theme-library-impl.md`

---

## 작업한 내용

관리자 AI 관련 페이지를 **모델 설정** / **생성 기록** 두 축으로 재구성. 각각 사진·영상·테마 탭 구조.

### 1. 사진 생성 히스토리 Admin API (`app/api/admin/ai-generations/route.ts`)
- 기존 `ai-themes` API 패턴 복제 (requireAdmin, withErrorHandler, 병렬 쿼리)
- `aiGenerations` INNER JOIN `users` — 페이지네이션 + 상태 필터 + 통계(총 생성수/비용/실패율)

### 2. 테마 모델 설정 지원 (`app/api/admin/ai-models/route.ts`)
- `aiModelSettings`에 `theme-claude-sonnet` ID로 저장
- GET에 `themeModel` 응답 추가, PATCH에서 테마 모델 ID도 허용
- 사진 모델 비활성화 시 최소 1개 보장 로직에서 테마 모델 제외

### 3. 테마 비활성화 체크 (`app/api/ai/theme/route.ts`)
- POST 초입에 `aiModelSettings`에서 `theme-claude-sonnet` enabled 확인
- `enabled === false`면 403 반환, 레코드 없으면 기본 활성

### 4. AI 모델 설정 페이지 탭 UI (`app/admin/ai-models/page.tsx`)
- 사진(기존 6개 카드) / 영상(placeholder) / 테마(활성화 토글 + 모델 정보) 3탭
- 테마 탭: Brain 아이콘, 모델명·비용·크레딧 정보 표시

### 5. AI 생성 기록 통합 페이지 (`app/admin/ai-history/page.tsx`)
- 사진 탭: 통계 카드 + 상태 필터 + 테이블(유저/스타일/상태/모델/비용/생성일)
- 테마 탭: 기존 ai-themes 페이지 코드 이동 (API 경로 유지)
- 공용 Pagination 컴포넌트로 중복 제거

### 6. 네비게이션 + 정리
- AdminNav: "AI 테마" → "AI 기록" (History 아이콘)
- `app/admin/ai-themes/` 삭제, `app/api/admin/ai-themes/` API는 유지

---

## 왜 했는지 (맥락)

AI 테마 라이브러리 구현 후 관리 페이지가 분산됨:
- `/admin/ai-models` — 사진 모델만
- `/admin/ai-themes` — 테마 히스토리만
- 사진 생성 히스토리 — DB에 데이터 있지만 관리자 UI 없음

영상 생성 기능 추가 예정이라, 지금 구조를 잡아두지 않으면 페이지가 계속 늘어남. "모델 설정"과 "생성 기록"을 분리하고 각각 탭으로 확장 가능한 구조로 전환.

---

## 논의/아이디어/고민

**테마 멀티 모델 지원 논의**: 구현 중 "테마 생성도 OpenAI/Gemini 쓸 수 있지 않냐"는 질문이 나옴. 맞는 말이라 설계 문서(`2026-02-09_theme-multi-model.md`)를 별도 작성.

현재 사진 생성은 이미 3개 프로바이더(Replicate/OpenAI/Gemini) 멀티 모델 구조가 있고, SDK도 설치되어 있음. 테마 생성도 같은 패턴으로 확장 가능:
- Claude Sonnet: ~$0.018/생성 (현재)
- GPT-4o: ~$0.015/생성
- Gemini Flash: ~$0.001/생성 (10~20배 저렴)

→ 다음 세션에서 구현 예정.

---

## 결정된 내용

| 결정 | 이유 |
|------|------|
| `aiModelSettings`에 `theme-claude-sonnet` 저장 | 별도 테이블 불필요, enabled/updatedAt로 충분 |
| 기본 enabled = true | 기존 동작 변경 없이, 관리자가 명시적으로 끌 때만 disabled |
| ai-themes API 경로 유지 | 프론트만 ai-history에서 호출, API 변경 불필요 |
| 사진 히스토리에 이미지 미리보기 없음 | S3 signed URL 필요 — 복잡도 대비 가치 낮음 |
| ai-history에서 Pagination 컴포넌트 공용화 | 사진/테마 탭 모두 같은 패턴이라 중복 제거 |
| 영상 탭 placeholder | 영상 모델 구현 전, 탭 구조만 미리 확보 |

---

## 난이도/발견

- **난이도**: 낮~중. 기존 ai-themes API 패턴을 그대로 복제하는 작업이 대부분. 탭 UI도 기존 컴포넌트 스타일 따름.
- **발견**: `tsc --noEmit` 시 `.next/types/`에 삭제된 ai-themes 페이지 참조가 캐시로 남아있어서 에러. `.next/dev/types`와 `.next/types` 삭제로 해결.
- 기존 테스트 파일(`__tests__/`)에 타입 에러 3개 존재 — 이번 작업과 무관 (Buffer/null 타입 불일치).

---

## 남은 것

- [ ] 테마 멀티 모델 구현 (설계: `2026-02-09_theme-multi-model.md`)
  - `lib/ai/theme-models.ts` 레지스트리
  - `lib/ai/theme-providers/` (anthropic, openai, gemini)
  - `theme-generation.ts` 리팩토링
  - `aiThemes.modelId` DB 마이그레이션
  - API/Admin 멀티 모델 지원
- [ ] 개발 서버에서 페이지 동작 검증 (탭 전환, 토글 저장, 페이지네이션)
- [ ] 테마 비활성화 후 `/api/ai/theme` POST → 403 반환 확인

---

## 다음 액션

1. 테마 멀티 모델 구현 (`theme-multi-model.md` 기반)
2. 사진 히스토리에 모델 필터 추가 (데이터 쌓이면)
3. 영상 생성 모델/히스토리 구현 (영상 기능 개발 시)

---

## 수정 파일 (9개)

| 파일 | 변경 |
|------|------|
| `app/api/admin/ai-generations/route.ts` | **신규** +74 — 사진 생성 히스토리 Admin API |
| `app/api/admin/ai-models/route.ts` | +23/-10 — 테마 모델 GET/PATCH 지원 |
| `app/api/ai/theme/route.ts` | +27/-8 — 비활성화 체크, 주석 번호 재정리 |
| `app/admin/ai-models/page.tsx` | +260/-128 — 3탭 UI (사진/영상/테마) |
| `app/admin/ai-history/page.tsx` | **신규** +438 — 통합 히스토리 (사진/영상/테마) |
| `components/admin/AdminNav.tsx` | +2/-2 — AI 테마 → AI 기록 |
| `app/admin/ai-themes/page.tsx` | **삭제** -199 — ai-history로 통합 |
| `docs/diary/..._admin-ai-menu-restructure.md` | **신규** — 이 문서 |
| `docs/diary/..._theme-multi-model.md` | **신규** — 멀티 모델 설계 문서 |

---

## 내 질문 평가 및 피드백

"테마 생성할 때도 openai랑 gemini api 이용할 수 있지 않아?" — 좋은 질문. SDK가 이미 설치되어 있고 사진 생성에서 멀티 프로바이더 패턴이 검증된 상태라, 테마에도 같은 구조를 적용하는 게 자연스러움. 특히 Gemini Flash의 비용 차이(10~20배)를 고려하면 실질적 가치가 있는 확장. 현재 구현에서 `theme-claude-sonnet` 단일 ID로 만들었는데, 멀티 모델 전환 시 이 부분을 `AI_THEME_MODELS` 레지스트리로 교체하면 됨. 설계 문서까지 미리 만들어뒀으니 다음 세션에서 바로 진행 가능.
