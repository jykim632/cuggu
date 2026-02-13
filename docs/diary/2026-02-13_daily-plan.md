# 2026-02-13 오늘 할 일

## 오전 완료 작업

### 1. DB 스키마 종합 리뷰 (`docs/db-review-2026-02-13.md`)
- 8인 전문가 팀 리뷰 수행 → 평균 59.75/100
- Critical 이슈 5개 발견: 크레딧 감사 추적 공백, CASCADE DELETE, timestamp without tz, AIStyle enum 불일치, RLS 전무
- Major 이슈 다수: FK 인덱스 누락, cost 컬럼 real 타입, templates.config text 타입

### 2. 공개 청첩장 캐싱 적용 (`app/inv/[id]/page.tsx`, `lib/invitation-cache.ts`)
- DB 직접 조회 → Redis 캐시 (5분 TTL) + DB fallback으로 전환
- `getInvitationCached()`, `getInvitationMetaCached()` 적용
- 조회수: 매 요청 DB update → `incrementViewCount()` Redis 배치 + lazy flush
- 청첩장 수정/삭제 시 `invalidateInvitationCache()` 호출 추가

### 3. CLAUDE.md 최신화
- 기술 스택, 핵심 파일, 구현 현황 전면 업데이트
- 실제 코드베이스와 괴리 해소

### 4. 기타
- `lib/rate-limit.ts` — `getRedis()` export 추가 (invitation-cache에서 사용)

---

## 오늘 작업 계획

### 1단계: P0 핫픽스 — DB 리뷰 Critical 이슈 (오전~점심)

어제 daily review + 오늘 DB 리뷰에서 공통 지적된 핵심 이슈.

| # | 작업 | 참조 | 상태 |
|---|------|------|------|
| 1-1 | **크레딧 감사 추적 완성** — `deductCredits()`/`refundCredits()`에 `ai_credit_transactions` 기록 추가 | DB 리뷰 Critical #1 | **완료** |
| 1-1b | **크레딧 감사 추적 UI** — 어드민 `/admin/credit-audit` + 사용자 설정 페이지 이력 | 1-1 후속 | **완료** |
| 1-2 | **AIStyle enum 3곳 동기화** — `schemas/ai.ts` 스키마를 DB enum 기준 15개로 통일 | DB 리뷰 Critical #4 | 미착수 |
| 1-3 | **CASCADE → RESTRICT** — `payments`, `ai_credit_transactions` FK를 restrict로 변경 | DB 리뷰 Critical #2 | 미착수 |
| 1-4 | **Apply 경쟁 조건 수정** — 트랜잭션 추가 또는 atomic append | 2/12 daily review P0 | 미착수 |

**1-1 완료 상세:**
- 백엔드: `deductCredits`/`refundCredits`/`reserveCredits`/`releaseCredits` → `ai_credit_transactions` INSERT (트랜잭션 내)
- 어드민 API: `GET /api/admin/credit-transactions` (타입/유저 필터 + 통계 + 페이지네이션)
- 사용자 API: `GET /api/ai/credits` 페이지네이션 지원 추가
- 공유 컴포넌트: `CreditTxBadge`, `CreditTxAmount`, `CreditTxList` (악센트 바, 복사 버튼, 페이지네이션)
- 어드민 페이지: `/admin/credit-audit` (통계 3종 + 필터 + 카드 리스트)
- 사용자 설정: 크레딧 이력 섹션 추가
- description 사용자 친화적으로 개선 (예약→배치 생성 등)
- 발견된 버그: 배치 Job 자연 완료 시 미사용 크레딧 자동 환불 누락 → `cuggu-9c0` 이슈 등록

### 2단계: 공개 청첩장 뷰 완성 (오후)

**서비스가 존재하려면 이게 완벽해야 함.** 캐싱은 오전에 붙였으니 나머지 정리.

| # | 작업 | 참조 |
|---|------|------|
| 2-1 | **섹션 렌더링 전체 점검** — 각 섹션 데이터 바인딩, 빈 데이터 처리, 순서 확인 | |
| 2-2 | **OG 메타태그 + 카카오톡 미리보기** — 실 동작 테스트 | |
| 2-3 | **비밀번호 게이트 테스트** — PasswordGate 컴포넌트 동작 확인 | |
| 2-4 | **모바일 반응형 점검** — 6개 템플릿 전부 모바일에서 깨지지 않는지 확인 | cuggu-bq5 |

### 3단계: 코드 품질 핫픽스 (공개 뷰 완성 후)

2/12 daily review에서 지적된 P1 이슈.

| # | 작업 | 참조 |
|---|------|------|
| 3-1 | **SSE 스트리밍 데이터 검증** — Zod 스키마로 서버 응답 검증 | 2/12 review P0 |
| 3-2 | **이미지 URL 호스트 검증** — CloudFront/S3 도메인만 허용 | 2/12 review P1 |
| 3-3 | **즐겨찾기 API Zod 교체** — 수동 타입 체크 → Zod 스키마 | 2/12 review P1 |

### 4단계: 결제 플로우 설계 (저녁, 시간 되면)

코드 아닌 설계만. 워터마크 게이트 → 결제 → 프리미엄 전환 경로 확보.

| # | 작업 | 참조 |
|---|------|------|
| 4-1 | **Toss Payments 연동 설계** — 체크아웃/확인/웹훅 플로우 | cuggu-8vc |
| 4-2 | **결제 → isPremium 전환 경로** 설계 | |

---

## 금지 사항

- **AI 앨범 v2 추가 작업** — 기존 코드 안정화 먼저 (cuggu-3ff는 보류)
- **새 설계 문서 작성** — 인라인 주석으로 충분
- **AI 테마 관련 작업** — 3일째 같은 결정

---

## Beads 현황 참고

**Ready (blocker 없는 것):**
- `cuggu-3ff` [P0] AI 앨범 v2 → **오늘은 금지**
- `cuggu-c7n` [P2] 크레딧 실시간 감소 UI
- `cuggu-mei` [P2] DB 연결 실패 시 안정성
- `cuggu-6h7` [P2] 에디터 GalleryTab CTA 교체
- `cuggu-ch7` [P3] DashboardNav AI 메뉴 네이밍
- `cuggu-5gl` [P3] Zustand 리렌더링 최적화

**In Progress:**
- `cuggu-6c2` [P0] Figma 템플릿 디자인 (디자이너 작업)

---

## 어제 피드백 반영 체크

| 어제 지적 | 오늘 대응 |
|-----------|-----------|
| 계획을 세우고 안 지킴 (3일 연속) | 이번엔 핫픽스 → 공개 뷰 → 품질 순서 준수 |
| 공개 청첩장 뷰 계속 밀림 | 2단계로 명시, 1단계 끝나면 바로 착수 |
| 문서 과잉 투자 | 금지 사항에 명시 |
| 사용자 가치 제로 | 공개 뷰 완성 = 실제 서비스 사용 가능 |
| P0 이슈 방치 | 1단계에서 Apply 경쟁조건 + DB Critical 처리 |
