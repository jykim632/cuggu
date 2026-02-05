# Cuggu - 모바일 청첩장 플랫폼

## 프로젝트 개요

한국 시장 타겟 모바일 청첩장 플랫폼. **AI 사진 생성**이 핵심 차별화 포인트.

## 기술 스택

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS, Framer Motion, Zustand
- **Backend**: Next.js API Routes, NextAuth.js v5 (카카오 로그인)
- **DB**: PostgreSQL (Supabase) + Drizzle ORM
- **Storage**: AWS S3 + CloudFront
- **AI**: Replicate API (Flux Pro/Dev, PhotoMaker)
- **Cache**: Upstash Redis

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
- Zod 스키마 필수 (런타임 검증) - `schemas/` 폴더
- 타입 정의 - `types/` 폴더
- 불필요한 리렌더링 주의

### 백엔드
- API 응답 형식 일관성
- 에러 핸들링 명확
- 민감 정보 로깅 금지

## 핵심 파일

- `db/schema.ts` - Drizzle 스키마 (User, Invitation, RSVP, AIGeneration, Payment 등)
- `lib/ai/replicate.ts` - AI 사진 생성 로직
- `lib/ai/models.ts` - AI 모델 정의 (Flux Pro/Dev, PhotoMaker)
- `app/api/ai/generate/route.ts` - AI 생성 API
- `components/editor/` - 탭 기반 폼 편집기 (EditorPanel, PreviewPanel, tabs/)

## 구현 현황

**완료**: 인증, 청첩장 CRUD, 폼 편집기, AI 사진 생성, 갤러리, 계좌 관리, 대시보드, 클래식 템플릿

**미구현**: 공개 청첩장 뷰 (`inv/[id]/`), Toss 결제, RSVP 게스트 폼, 추가 템플릿, 카카오톡 공유

## Next.js 16 주의사항

- 모든 페이지/레이아웃은 `async function`
- `params`는 Promise → `const { id } = await params` 필수
