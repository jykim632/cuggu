# 관리자 AI 메뉴 재구성 — 모델 탭 + 생성 기록 통합

> 날짜: 2026-02-09
> 브랜치: `feat/ai-theme-generation`
> 선행 작업: `2026-02-09_ai-theme-library-impl.md`

---

## 배경

관리자 AI 관련 페이지가 분산되어 있음:

| 현재 경로 | 내용 | 문제 |
|-----------|------|------|
| `/admin/ai-models` | 사진 생성 모델 6개 enable/recommend 토글 | 테마 모델 관리 없음 |
| `/admin/ai-themes` | 테마 생성 히스토리만 | "모델"과 "기록"이 분리 안 됨 |
| (없음) | 사진 생성 히스토리 | DB에 `aiGenerations` 데이터 있지만 조회 UI 없음 |

영상 생성 기능이 추가될 예정이라, AI 관련 메뉴를 **모델 설정** / **생성 기록** 두 축으로 정리하고, 각각 사진·영상·테마 탭을 두는 구조로 전환.

---

## 변경 후 구조

```
관리자 네비게이션:
├── AI 모델 설정   → /admin/ai-models
│   ├── 사진 생성 탭 (기본) — 기존 6개 모델 카드 + enable/recommend 토글
│   ├── 영상 생성 탭 — placeholder "준비 중"
│   └── 테마 생성 탭 — 기능 활성화 토글 + 모델 정보 표시
│
└── AI 생성 기록   → /admin/ai-history (신규)
    ├── 사진 생성 탭 (신규) — aiGenerations 테이블 조회
    ├── 영상 생성 탭 — placeholder
    └── 테마 생성 탭 — 기존 ai-themes 페이지 내용 이동
```

---

## 작업 내용

### 1. AI 생성 기록 API (`/api/admin/ai-generations`)

**신규 파일**: `app/api/admin/ai-generations/route.ts`

기존 `ai-themes` API 패턴 그대로 복제:
- `requireAdmin()` 인증
- `withErrorHandler()` 래핑
- 페이지네이션 + 필터 + 통계 병렬 쿼리

```typescript
// Query 파라미터
QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']).optional(),
})

// 응답 구조
{
  generations: [{
    id, style, status, providerType,
    cost, creditsUsed, createdAt,
    userEmail, userName
  }],
  pagination: { page, pageSize, total, totalPages },
  stats: { totalCount, totalCost, failRate }
}
```

DB 쿼리: `aiGenerations` LEFT JOIN `users` (이메일/이름).

### 2. AI 모델 API 테마 지원 (`/api/admin/ai-models`)

**수정 파일**: `app/api/admin/ai-models/route.ts`

- `aiModelSettings` 테이블 재활용 — modelId `'theme-claude-sonnet'`으로 저장
- GET: 기존 사진 모델 목록에 테마 모델 설정도 포함해서 반환
- PATCH: modelId가 `'theme-claude-sonnet'`일 때도 upsert 동작 (enabled 토글)

기존 PATCH의 "AI_MODELS에 존재하는지 확인" 로직을 `'theme-claude-sonnet'`도 허용하도록 수정.

### 3. 테마 생성 비활성화 체크 (`/api/ai/theme`)

**수정 파일**: `app/api/ai/theme/route.ts`

POST 핸들러 초입에 `aiModelSettings`에서 `theme-claude-sonnet` 조회:
- `enabled === false`면 403 반환 ("테마 생성 기능이 비활성화되어 있습니다")
- 레코드 없거나 `enabled === true`면 통과 (기본 활성)

### 4. AI 모델 페이지 탭 UI (`/admin/ai-models`)

**수정 파일**: `app/admin/ai-models/page.tsx`

탭 3개 (`useState`):
- **사진 생성** (기본): 기존 모델 카드 UI 그대로
- **영상 생성**: 회색 placeholder "영상 생성 모델은 준비 중입니다"
- **테마 생성**: 테마 모델 설정 카드

테마 생성 탭 내용:
- 기능 활성화/비활성화 토글 (PATCH `/api/admin/ai-models` 호출)
- 현재 모델 정보: `claude-sonnet-4-5-20250929`
- 비용 정보: ~$0.018/생성 (input $3 + output $15 / 1M tokens)

### 5. AI 생성 기록 페이지 (`/admin/ai-history`)

**신규 파일**: `app/admin/ai-history/page.tsx`

탭 3개:

**사진 생성 탭** (신규):
- 통계 카드: 총 생성 수 / 총 비용 / 실패율
- 필터: 상태 (전체 / COMPLETED / FAILED / PROCESSING)
- 페이지네이션 테이블 (20개/페이지):
  - 유저 (이름, 이메일)
  - 스타일 (enum 값)
  - 상태 뱃지
  - 모델 (providerType)
  - 비용 (USD)
  - 생성일

**영상 생성 탭**: placeholder

**테마 생성 탭**: 기존 `ai-themes/page.tsx` 코드 이동
- 통계 카드, 필터, 페이지네이션 테이블 그대로
- API 호출: `/api/admin/ai-themes` (기존 유지)

### 6. 네비게이션 + 정리

**수정**: `components/admin/AdminNav.tsx`
```diff
- { href: "/admin/ai-themes", label: "AI 테마", icon: Palette },
+ { href: "/admin/ai-history", label: "AI 기록", icon: History },
```

**삭제**: `app/admin/ai-themes/` 디렉토리 (내용은 ai-history로 이동)

**유지**: `app/api/admin/ai-themes/route.ts` (API는 그대로, 프론트만 경로 변경)

---

## 결정 사항

| 결정 | 이유 |
|------|------|
| `aiModelSettings`에 `theme-claude-sonnet` 저장 | 별도 테이블 불필요, 기존 enabled/updatedAt 필드로 충분 |
| 기본 enabled = true (레코드 없을 때) | 기존 동작 변경 없이 관리자가 명시적으로 끌 때만 disabled |
| 사진 히스토리에 이미지 미리보기 없음 | S3 signed URL 필요해서 복잡 — 당장 필요 없음 |
| 탭을 컴포넌트로 분리하지 않고 조건부 렌더링 | 탭별 코드가 작으면 분리 오버헤드 > 가독성 이점. 길어지면 그때 분리 |
| 영상 탭은 placeholder만 | 영상 모델/히스토리 구현 전이라 구조만 잡아둠 |
| ai-themes API는 유지 | 프론트 경로만 바뀌고 API는 안정적이라 변경 불필요 |

---

## 파일 변경 목록

| 파일 | 액션 | 내용 |
|------|------|------|
| `app/api/admin/ai-generations/route.ts` | **신규** | 사진 생성 히스토리 Admin API |
| `app/api/admin/ai-models/route.ts` | 수정 | 테마 모델 설정 GET/PATCH 지원 |
| `app/api/ai/theme/route.ts` | 수정 | 테마 기능 비활성화 시 403 반환 |
| `app/admin/ai-models/page.tsx` | 수정 | 사진/영상/테마 탭 UI 추가 |
| `app/admin/ai-history/page.tsx` | **신규** | 통합 히스토리 페이지 (사진/영상/테마) |
| `components/admin/AdminNav.tsx` | 수정 | AI 테마 → AI 기록 (아이콘: History) |
| `app/admin/ai-themes/` | 삭제 | ai-history로 통합 |

---

## 하지 않는 것

- 영상 생성 모델/히스토리 구현 (placeholder만)
- 테마 모델 선택 드롭다운 (현재 Claude 하나뿐)
- 사진 히스토리 이미지 미리보기 (S3 signed URL 필요)
- ai-themes API 경로 변경 (프론트만 이동)

---

## 작업 순서

1. DB/API: `ai-generations` admin API 신규 + `ai-models` API 테마 모델 지원
2. `ai-theme/route.ts` 비활성화 체크 추가
3. `ai-models/page.tsx` 탭 UI 추가
4. `ai-history/page.tsx` 신규 (사진 + 테마 히스토리 통합)
5. `AdminNav.tsx` 수정 + `ai-themes/` 삭제
6. `tsc --noEmit` 타입 체크

---

## 검증 체크리스트

- [ ] `/admin/ai-models` → 사진/영상/테마 탭 전환
- [ ] 테마 탭에서 활성화 토글 → DB 저장
- [ ] `/admin/ai-history` → 사진 탭 통계 카드 + 테이블 + 페이지네이션
- [ ] `/admin/ai-history` → 테마 탭 기존 동작 유지
- [ ] 테마 기능 비활성화 후 `/api/ai/theme` POST → 403
- [ ] TypeScript 빌드 에러 없음 (`tsc --noEmit`)
