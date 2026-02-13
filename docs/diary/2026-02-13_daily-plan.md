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
| 1-2 | **AIStyle enum 3곳 동기화** — `schemas/ai.ts` 스키마를 DB enum 기준 15개로 통일 | DB 리뷰 Critical #4 | **완료** |
| 1-3 | **CASCADE → RESTRICT** — `payments`, `ai_credit_transactions` FK를 restrict로 변경 | DB 리뷰 Critical #2 | **완료** |
| 1-4 | **Apply 경쟁 조건 수정** — 트랜잭션 추가 또는 atomic append | 2/12 daily review P0 | **완료** |

**1-1 완료 상세:**
- 백엔드: `deductCredits`/`refundCredits`/`reserveCredits`/`releaseCredits` → `ai_credit_transactions` INSERT (트랜잭션 내)
- 어드민 API: `GET /api/admin/credit-transactions` (타입/유저 필터 + 통계 + 페이지네이션)
- 사용자 API: `GET /api/ai/credits` 페이지네이션 지원 추가
- 공유 컴포넌트: `CreditTxBadge`, `CreditTxAmount`, `CreditTxList` (악센트 바, 복사 버튼, 페이지네이션)
- 어드민 페이지: `/admin/credit-audit` (통계 3종 + 필터 + 카드 리스트)
- 사용자 설정: 크레딧 이력 섹션 추가
- description 사용자 친화적으로 개선 (예약→배치 생성 등)
- 발견된 버그: 배치 Job 자연 완료 시 미사용 크레딧 자동 환불 누락 → `cuggu-9c0` 이슈 등록

**1-2 완료 상세:**
- `schemas/ai.ts`: AIStyleSchema를 Legacy 5 + New 10 = 15개로 확장 (DB enum 기준 통일)
- `app/api/ai/generate/route.ts`, `stream/route.ts`: 로컬 AIStyleSchema 우회 제거 → 공용 스키마 import
- 죽은 코드 `getStylePrompt()` 제거 (실제 프롬프트는 `lib/ai/prompts.ts`에서 처리)
- 향후 AIStyle 테이블 분리 이슈 등록 → `cuggu-40m` [P3]

**1-3 완료 상세:**
- `db/schema.ts`: `payments`, `aiCreditTransactions` FK를 `onDelete: 'cascade'` → `'restrict'`로 변경
- Drizzle 마이그레이션 생성: `0006_cascade-to-restrict.sql`
- 유저 삭제 시 결제/크레딧 이력 보존 (법적 5년 보관 요건 충족)
- 유저 삭제 정책 이슈 등록 → `cuggu-1nn` [P2] (계정 삭제 UI `cuggu-mi2`가 의존)

**1-4 완료 상세:**
- 3개 API의 갤러리 이미지 추가 로직을 `db.transaction()`으로 래핑
  - `generations/apply`: 단건 AI 사진 → 갤러리
  - `albums/[id]/apply`: 앨범 → 갤러리 + 앨범 상태 변경 (기존 별도 쿼리 2개 → 단일 tx로 통합)
  - `upload/gallery`: 갤러리 직접 업로드
- 중복 체크 `includes()` → `Set.has()`로 성능 개선
- 동시 요청 시 read-modify-write race condition 해소
- 발견된 이슈: `upload/gallery` 한도 체크가 tx 밖이라 동시 업로드 시 한도 초과 가능 → `cuggu-udn` [P3]
- 관련 이슈: `cuggu-r82` 갤러리-앨범 플로우 재설계에서 재활용할 apply API 2개의 동시성 안전성 확보

### 2단계: 공개 청첩장 뷰 완성 (오후)

**서비스가 존재하려면 이게 완벽해야 함.** 캐싱은 오전에 붙였으니 나머지 정리.

| # | 작업 | 참조 | 상태 |
|---|------|------|------|
| 2-1 | **섹션 렌더링 전체 점검** — 각 섹션 데이터 바인딩, 빈 데이터 처리, 순서 확인 | | **완료** |
| 2-2 | **OG 메타태그 + 카카오톡 미리보기** — 실 동작 테스트 | | **완료** |
| 2-3 | **비밀번호 게이트 테스트** — PasswordGate 컴포넌트 동작 확인 | | **완료** |
| 2-4 | **모바일 반응형 점검** — 6개 템플릿 전부 모바일에서 깨지지 않는지 확인 | cuggu-bq5 | **완료** |

**2단계 완료 상세:**
- GreetingSection: `greeting` undefined → 빈 섹션 렌더링 버그 수정 (null guard)
- CeremonySection: invalid date → `NaN` 크래시 방어 (isNaN 체크)
- CoverSection: groom/bride name 둘 다 비면 빈 커버 → null guard
- OG meta: 갤러리/AI 사진 모두 없을 때 `/og-default.png` fallback 추가
- ShareBar: `imageUrl`에 빈 문자열 대신 `undefined` 전달 (카카오 공유 빈 이미지 방지)
- 비밀번호 게이트: UI→API→쿠키→리로드 플로우 정상, Rate limit(5회/15분) + httpOnly 쿠키 24h 확인
- 모바일 반응형: `var(--screen-height, 100vh)`, `safe-area-inset-bottom`, `min-h-[44px]` 터치 타겟, 라이트박스 `max-h-[85vh]` 모두 정상
- 섹션 순서: `sanitizeSectionOrder()` + `accounts`↔`account` 매핑 정상
- 참고: `/public/og-default.png` 기본 이미지 에셋 별도 추가 필요

### 3단계: 코드 품질 핫픽스 (공개 뷰 완성 후)

2/12 daily review에서 지적된 P1 이슈.

| # | 작업 | 참조 | 상태 |
|---|------|------|------|
| 3-1 | **SSE 스트리밍 데이터 검증** — Zod 스키마로 서버 응답 검증 | 2/12 review P0 | **완료** |
| 3-2 | **이미지 URL 호스트 검증** — CloudFront/S3 도메인만 허용 | 2/12 review P1 | **완료** |
| 3-3 | **즐겨찾기 API Zod 교체** — 수동 타입 체크 → Zod 스키마 | 2/12 review P1 | **완료** |

**3-1 완료 상세:**
- `schemas/ai.ts`: SSE 4종 이벤트 스키마 추가 (discriminatedUnion — status/image/done/error)
- `lib/ai/parse-sse.ts`: 신규 유틸리티 — 버퍼 파싱 + Zod 검증 통합, 검증 실패 시 skip + warn
- `hooks/useAIGeneration.ts`: generateSingle/generateBatch 모두 `parseSSEEvents()` 적용
- `components/editor/tabs/gallery/AIPhotoGenerator.tsx`: 동일 적용
- 두 곳의 중복 SSE 파싱 로직을 공유 함수로 추출

**3-2 완료 상세:**
- `lib/ai/s3.ts`: `isAllowedImageHost()` 추가 — CloudFront/S3 도메인만 화이트리스트
- `app/api/ai/select/route.ts`: 수동 파싱 → `SelectAIPhotoRequestSchema.safeParse()` + `isAllowedImageHost()` 체크
- 임의 외부 URL이 DB에 저장되는 취약점 차단

**3-3 완료 상세:**
- `schemas/ai.ts`: `ToggleFavoriteSchema` 추가
- `app/api/ai/generations/[id]/route.ts`: `typeof` 수동 체크 → Zod safeParse 교체

### 4단계: 결제 플로우 설계 (저녁)

Toss Payments → **PortOne V2 + 네이버페이**로 변경. 스마트스토어 판매 채널도 추가.

| # | 작업 | 참조 | 상태 |
|---|------|------|------|
| 4-1 | **PortOne V2 + 네이버페이 결제 설계** — 자사 사이트 결제 플로우 | cuggu-8vc (closed) | **완료** |
| 4-2 | **스마트스토어 연동 설계** — 활성화 페이지로 주문 검증 | | **완료** |
| 4-3 | **결제 → isPremium 전환 경로** 설계 | | **완료** (4-1에 포함) |
| 4-4 | **Beads 이슈 등록** — Phase 1 (P1 6개) + Phase 2 (P2 2개) + 네이버 로그인 (P2) | | **완료** |

**4단계 완료 상세:**
- 기존 Toss Payments 설계 (`docs/payment-system-plan.md`, `cuggu-8vc`) 폐기
- 신규 설계: `docs/payment-flow-design.md`
- **자사 사이트**: PortOne V2 SDK → 네이버페이 → 서버 검증(조회만) → 보상 지급
- **스마트스토어**: 상품 등록 → 구매자가 `/activate`에서 로그인+주문번호 입력 → Commerce API 검증 → 보상 지급
- DB 변경: `paymentMethodEnum` TOSS→NAVER_PAY, `paymentChannelEnum` 신규(SITE|SMARTSTORE), `paymentKey`→`paymentId`
- 네이버 로그인 추가 예정 (`cuggu-9ew`, 별도 작업)

**등록된 Beads 이슈:**

Phase 1 — 자사 사이트 결제 (P1, 순차 의존):
| 순서 | 이슈 | 작업 |
|------|------|------|
| 1 | `cuggu-ae6` | DB 마이그레이션 (enum + 컬럼) |
| 2 | `cuggu-p7b` | schemas/payment.ts 리팩터 (Toss→PortOne) |
| 3 | `cuggu-0jo` | lib/payments/ 서버 유틸 (portone.ts + grant.ts) |
| 4 | `cuggu-atb` | API routes (create + complete) |
| 5 | `cuggu-005` | CheckoutButton + 결제 페이지 |
| 6 | `cuggu-03e` | 기존 버튼 3곳 + 어드민 연결 |

Phase 2 — 스마트스토어 (P2, Phase 1 완료 후):
| 순서 | 이슈 | 작업 |
|------|------|------|
| 7 | `cuggu-97k` | Commerce API 클라이언트 |
| 8 | `cuggu-fa4` | 활성화 API + 페이지 |

별도:
| 이슈 | 작업 |
|------|------|
| `cuggu-9ew` | 네이버 로그인 (NextAuth provider) |

---

## 금지 사항

- **AI 앨범 v2 추가 작업** — 기존 코드 안정화 먼저 (cuggu-3ff는 보류)
- **AI 테마 관련 작업** — 3일째 같은 결정

---

## 어제 피드백 반영 체크

| 어제 지적 | 오늘 대응 |
|-----------|-----------|
| 계획을 세우고 안 지킴 (3일 연속) | 핫픽스 → 공개 뷰 → 품질 → 결제 설계 순서 준수 |
| 공개 청첩장 뷰 계속 밀림 | 2단계에서 완료 |
| 문서 과잉 투자 | 결제 설계는 필수 문서, 나머지는 자제 |
| 사용자 가치 제로 | 공개 뷰 완성 + 결제 설계로 MVP 경로 확보 |
| P0 이슈 방치 | 1단계에서 전부 처리 완료 |
