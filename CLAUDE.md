# Cuggu - 모바일 청첩장 플랫폼

## 프로젝트 개요

한국 시장 타겟 모바일 청첩장 플랫폼. **AI 사진 생성**이 핵심 차별화 포인트.

## 기술 스택

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS, Framer Motion, Zustand
- **Backend**: Next.js API Routes, NextAuth.js v5 (카카오 로그인)
- **DB**: PostgreSQL (Supabase) + Drizzle ORM
- **Storage**: AWS S3 + CloudFront
- **AI**: 멀티 프로바이더 — Replicate (Flux Pro/Dev, PhotoMaker), OpenAI (GPT Image, DALL-E 3), Google Gemini (Flash/Pro), Anthropic Claude (테마 생성)
- **Face Detection**: Azure Face API
- **Cache/Rate Limit**: Upstash Redis
- **Testing**: Vitest
- **Form**: react-hook-form + @hookform/resolvers
- **DnD**: @dnd-kit (앨범 큐레이션)

## 기본 원칙

- **계획 먼저, 코드는 나중**: 구현 전 설계/선택지/리스크 정리 후 승인받기
- **유지보수성 우선**: 혼자 운영 가능한 수준의 복잡도 유지
- **커밋은 요청 시에만**: 자동 커밋 금지

## 역할 & 커뮤니케이션

- 시니어 풀스택 엔지니어 + 아키텍트 역할
- 반말, 핵심만, 문제 있으면 직접 지적, 칭찬보다 냉정한 리뷰

## 작업 흐름

### 설계 단계
기능 구현 전: 선택지 → 장단점 → 추천안 정리. 데이터 구조, 트랜잭션, 확장성, 유지보수 고려.

### 구현 단계
가독성 > 코드 길이. 추상화는 꼭 필요할 때만. 함수/모듈 책임 명확.

### 리뷰 관점
운영 장애 가능성, 트래픽 병목, 보안 리스크, 3개월 후 문제점, 리팩터링 우선순위.

## 코드 규칙

### 공통
- 기존 코드 패턴/컨벤션 따르기
- 불필요한 복잡도 추가 금지
- 타입 안전성 확보

### 프론트엔드
- Zod 스키마 필수 (런타임 검증) — `schemas/` 폴더 (9개 파일: common, invitation, rsvp, user, payment, ai, theme, admin, index)
- 타입 정의 — `types/` 폴더
- 커스텀 훅 — `hooks/` 폴더
- Zustand 스토어 — `stores/` 폴더
- 불필요한 리렌더링 주의

### 백엔드
- API 응답 형식 일관성
- 에러 핸들링 명확
- 민감 정보 로깅 금지
- Rate limiting — Upstash Redis + Lua 스크립트 (`lib/rate-limit.ts`)

## 핵심 파일

### DB & 스키마
- `db/schema.ts` — Drizzle 스키마 (17개 테이블: users, templates, invitations, rsvps, aiGenerations, aiAlbums, aiReferencePhotos, aiGenerationJobs, aiCreditTransactions, payments, aiModelSettings, appSettings, aiThemes + NextAuth 테이블)

### AI 시스템
- `lib/ai/models.ts` — AI 모델 정의 (7개 모델)
- `lib/ai/providers/` — 프로바이더 추상화 (replicate, openai, gemini)
- `lib/ai/generate.ts` — 코어 생성 로직
- `lib/ai/credits.ts` — 크레딧 관리
- `lib/ai/face-detection.ts` — Azure 얼굴 감지
- `lib/ai/theme-generation.ts` — AI 테마 생성 (Anthropic/OpenAI/Gemini)
- `lib/ai/theme-providers/` — 테마 프로바이더 (anthropic, openai, gemini)
- `lib/ai/prompts.ts`, `lib/ai/constants.ts`, `lib/ai/validation.ts`

### 캐싱 & 인프라
- `lib/invitation-cache.ts` — Redis 캐싱 (5분 TTL, 조회수 lazy flush)
- `lib/rate-limit.ts` — 범용 Rate limiter

### 에디터 & 템플릿
- `components/editor/` — 탭 기반 폼 편집기 (9개 탭: BasicInfo, Greeting, Venue, Gallery, Account, Rsvp, Template, Settings + AI 연동)
- `components/templates/` — 6개 템플릿 (Classic, Modern, Elegant, Floral, Minimal, Natural) + BaseTemplate
- `lib/templates/` — 템플릿 시스템 (types, themes, resolvers, safelist)

## 주요 API Routes (39개)

- **AI** (17): generate(+stream), generations, albums, jobs, reference-photos, credits, models, theme, select
- **Admin** (7): stats, users, payments, ai-generations, ai-themes, ai-models, settings
- **Invitations** (5): CRUD, RSVP, verify
- **User** (3): profile, settings, credits
- **기타**: dashboard/stats, payments/history, upload/gallery, search-address, cron/cleanup

## 구현 현황

**완료**:
- 인증 (카카오 로그인, NextAuth v5)
- 청첩장 CRUD + 폼 편집기 (9개 탭)
- 6개 템플릿 (Classic/Modern/Elegant/Floral/Minimal/Natural)
- AI 사진 생성 — 멀티 프로바이더 (Replicate, OpenAI, Gemini), 15개 스타일
- AI 앨범 시스템 v2 (앨범 기반 관리, 배치 생성, 참조 사진 라이브러리)
- AI 크레딧 시스템 (트랜잭션 감사 추적, DEDUCT/REFUND/PURCHASE/BONUS)
- AI 테마 생성 (Claude/GPT/Gemini로 템플릿 테마 자동 생성)
- 갤러리 + 계좌 관리
- 대시보드 + 통계
- 공개 청첩장 뷰 (`inv/[id]/`) + Redis 캐싱 (5분 TTL)
- RSVP 하객 폼
- 카카오톡 공유 + 카카오 주소 검색
- 어드민 패널 (유저 관리, 결제 내역, AI 생성 이력, 모델 설정, 앱 설정)
- A/B/C 랜딩 페이지
- Rate limiting (Upstash Redis)
- 얼굴 감지 (Azure Face API)
- 모바일 에디터 (`/m/editor`)

**미구현/부분 구현**:
- Toss 결제 — 스키마/타입 정의됨, 결제 내역 API 있음, 실제 체크아웃/웹훅 미구현

## Next.js 16 주의사항

- 모든 페이지/레이아웃은 `async function`
- `params`는 Promise → `const { id } = await params` 필수
