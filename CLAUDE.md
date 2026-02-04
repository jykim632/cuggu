# 모바일 청첩장 플랫폼 "Cuggu" 구현 계획

## 프로젝트 개요

완전히 새로운 상업적 모바일 청첩장 플랫폼을 개발합니다. 한국 시장을 타겟으로 하며, **AI 사진 생성**을 핵심 차별화 포인트로 합니다.

## 핵심 차별화 포인트

### 1. AI 웨딩 사진 자동 생성 (핵심)

- 증명 사진만 업로드하면 웨딩 컨셉에 맞는 AI 사진 4장 자동 생성
- 웨딩 화보 촬영 비용(수십만원~수백만원) 절감
- Replicate API + 다중 모델 지원:
  - **Flux 1.1 Pro** ($0.04/이미지) - 고품질
  - **Flux Dev** ($0.025/이미지) - 저렴
  - **PhotoMaker** ($0.0095/이미지) - 얼굴 보존 우수
- 신랑/신부 역할 기반 생성 지원
- 크레딧 시스템: 무료 2회, 프리미엄 10회

### 2. 보안과 신뢰성

- 피싱 공격 1,189% 증가 대응
- nanoid URL 암호화
- HTTPS 강제, Rate limiting (Upstash, 10분당 5회)
- 결혼식 후 자동 삭제 (90일)

### 3. 폼 기반 편집기

- 탭 기반 구조화된 편집 (기본정보/인사말/갤러리/계좌/장소/설정/템플릿)
- 실시간 미리보기
- 모바일 우선 설계

### 4. 통합 플랫폼

- 청첩장 + RSVP + 하객 관리 + AI 사진 생성

## 기술 스택

### Frontend

- **Next.js 16** (App Router) + TypeScript
  - Turbopack 기본 탑재 (빠른 빌드)
  - Async params/id 패턴 (모든 params는 await 필요)
- **Tailwind CSS** (순수 Tailwind, 커스텀 UI 컴포넌트)
- **Framer Motion** (애니메이션 효과)
- **Zustand** (상태 관리)
- **React Hook Form + Zod** (폼 관리 및 검증)
- **Lucide React** (아이콘)

### Backend

**Phase 1 (MVP): Full-stack Developer 1명** ← 현재 단계
- **Next.js API Routes** (청첩장 CRUD, RSVP, 인증)
- **Replicate API** (AI 사진 생성 - 다중 모델)
- **NextAuth.js v5 beta** (카카오/이메일 로그인, Drizzle 어댑터)
- **AI 서비스 분리 설계** (`/api/ai/*` endpoint)

**Phase 2 (출시 후): Backend 개발자 추가**
- **NestJS 마이크로서비스** (AI 전담)
  - ComfyUI self-hosting (GPU 서버)
  - AI 모델 fine-tuning (LoRA)
  - 이미지 처리 파이프라인
- **마이그레이션**: `/api/ai/*` → NestJS 서비스

### AI 사진 생성

- **Replicate API** (Flux 1.1 Pro / Flux Dev / PhotoMaker)
- **Azure Face API** (얼굴 감지, 무료 티어)
- **Sharp** (이미지 최적화 - WebP 변환, 1200x1200, 85% 품질)
- 파이프라인:
  1. 증명 사진 업로드 → 얼굴 감지 (Azure)
  2. 웨딩 스타일 + AI 모델 + 역할(신랑/신부) 선택
  3. Replicate로 4장 생성 (배치)
  4. 생성 이미지 S3 영구 저장 (Replicate CDN → S3 복사)
  5. 사용자 선택 및 청첩장 적용

### Database & Storage

- **PostgreSQL** (Supabase - 10GB 무료)
- **Drizzle ORM** (타입 안전, Serverless 최적화)
- **AWS S3** (파일 스토리지) + **CloudFront** (CDN, 선택적)
  - 폴더 구조: `ai-originals/`, `ai-generated/{userId}`, `gallery/{userId}`
- **Redis** (Upstash - 캐싱, Rate limiting)

### Deployment

- **Vercel** (Frontend + API)
- **Railway** (마이크로서비스, Phase 2)

### Payment

- **Toss Payments** (주력) - 스키마 준비됨, 연동 미구현
- **Kakao Pay** (서브) - 스키마 준비됨

## 기본 원칙

- **계획 먼저, 코드는 나중**: 구현 전 설계/선택지/리스크 정리 후 승인받기
- **유지보수성 우선**: 혼자 운영 가능한 수준의 복잡도 유지
- **커밋은 요청 시에만**: 자동 커밋 금지

## 역할 정의

너는 시니어 풀스택 엔지니어 + 아키텍트 역할이다.

## 커뮤니케이션

- 반말, 핵심만
- 문제 있으면 직접 지적
- 칭찬보다 냉정한 리뷰

---

## 작업 흐름

### 1. 설계 단계

기능 구현 전 아래 항목 정리:

| 항목   | 내용                     |
| ------ | ------------------------ |
| 선택지 | 가능한 접근 방식들       |
| 장단점 | 각 선택지별 트레이드오프 |
| 추천안 | 프로젝트 맥락에서 최선   |

필수 고려사항:

- 데이터 구조
- 트랜잭션 / 일관성
- 확장 시 병목
- 유지보수 부담

### 2. 구현 단계

조건:

- 가독성 > 코드 길이
- 추상화는 꼭 필요할 때만
- 함수/모듈 책임 명확

추가 설명:

- 구조 선택 이유
- 변경 가능성 높은 지점 표시

### 3. 리뷰 관점

1. 운영 중 장애 가능성
2. 트래픽 증가 시 병목
3. 보안 / 권한 리스크
4. 3개월 후 문제될 포인트
5. 리팩터링 우선순위

---

## 코드 규칙

### 공통

- 기존 코드 패턴/컨벤션 따르기
- 불필요한 복잡도 추가 금지
- 타입 안전성 확보

### 프론트엔드 (React/TypeScript)

- 타입 정의는 Zod 스키마 필수 (런타임 검증)
- API 응답, 폼 데이터 등 외부 데이터는 Zod로 파싱
- 스키마는 `schemas/` 폴더에 작성
- 타입 정의는 `types/` 폴더에 작성
- 불필요한 리렌더링 주의

### 백엔드

- API 응답 형식 일관성 유지
- 에러 핸들링 명확하게
- 민감 정보 로깅 금지

---

## 문서화 (마무리)

기능 완료 후 정리:

- 이 기능의 존재 이유
- 핵심 설계 결정 3가지
- 절대 건드리면 안 되는 부분
- 바꿔도 되는 부분

---

## 구현 현황

### 완료 (✅)

- **인증**: NextAuth v5 + Drizzle 어댑터 + 카카오 로그인
- **청첩장 CRUD**: 생성, 편집, 조회, 삭제 + 상태 관리 (DRAFT/PUBLISHED/EXPIRED/DELETED)
- **편집기**: 폼 기반 탭 편집기 (BasicInfo/Greeting/Gallery/Account/Venue/Settings/Template)
- **AI 사진 생성**: 3개 모델 지원, 역할 기반 생성, S3 영구 저장, 크레딧 시스템
- **갤러리**: 업로드 (최대 10장), S3 저장, Sharp 최적화, 라이트박스 확대
- **부모님 계좌**: 신랑/신부 부모님 다중 계좌 관리 (JSON 스키마)
- **대시보드**: 설정 페이지, 프로필 관리, 통계 API
- **클래식 템플릿**: 1개 완성 (ClassicTemplate)
- **랜딩 페이지**: A/B/C 3종 (마케팅)
- **테스트**: AI 생성 시스템 Mock 테스트 (Vitest)

### 부분 구현 (⚠️)

- **결제**: DB 스키마 + 결제 내역 API만 존재, Toss 결제 처리 미구현
- **RSVP**: DB 스키마 존재, 게스트 폼 UI 미구현
- **모던 템플릿**: 컴포넌트 파일 존재, 완성도 미확인

### 미구현 (❌)

- **공개 청첩장 뷰**: `inv/[id]/` 라우트 (공유/RSVP 수집용)
- **결제 처리**: Toss Payments 실제 연동
- **RSVP 게스트 폼**: 공개 RSVP 제출 UI
- **3개 추가 템플릿**: Vintage, Floral, Minimal
- **주소 검색**: 장소 편집기 카카오맵 연동
- **카카오톡 공유**: Open Graph + 공유 기능
- **QR 코드 생성**
- **엑셀 다운로드** (RSVP 통계)

## 수익 모델

### 무료 플랜

- 청첩장 생성 무제한
- 5개 기본 템플릿
- AI 사진 생성 2회 (512x512, 워터마크)
- 갤러리 20장
- 하단에 "Made with Cuggu" 로고

### 프리미엄 (9,900원, 일회성)

- 20개+ 템플릿
- AI 사진 생성 10회 (1024x1024, 워터마크 제거)
- 갤러리 100장
- 광고 제거
- 커스텀 폰트, 애니메이션 효과
- 비밀번호 보호

### AI 크레딧 추가 구매

- 1,000원/회
- 10회 패키지: 8,000원 (20% 할인)

## 프로젝트 구조

```
cuggu/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── (marketing)/             # 랜딩 페이지
│   │   ├── landing-a/
│   │   ├── landing-b/
│   │   ├── landing-c/
│   │   └── layout.tsx
│   ├── dashboard/
│   │   ├── ai-photos/           # AI 사진 생성 페이지
│   │   │   └── components/      # AIPhotoUploader, ModelSelector, StyleSelector 등
│   │   ├── invitations/
│   │   ├── settings/
│   │   └── layout.tsx
│   ├── editor/[id]/             # 청첩장 편집기
│   ├── templates/preview/       # 템플릿 미리보기
│   ├── api/
│   │   ├── auth/[...nextauth]/
│   │   ├── invitations/         # CRUD + verify
│   │   ├── ai/
│   │   │   ├── generate/        # AI 사진 생성 (Replicate)
│   │   │   ├── generations/     # 생성 목록 조회
│   │   │   └── select/          # 생성된 사진 선택
│   │   ├── upload/
│   │   │   └── gallery/         # 갤러리 이미지 업로드
│   │   ├── user/
│   │   │   ├── credits/         # AI 크레딧 조회
│   │   │   ├── profile/         # 프로필 관리
│   │   │   └── settings/        # 설정 관리
│   │   ├── dashboard/stats/     # 대시보드 통계
│   │   └── payments/history/    # 결제 내역
│   └── layout.tsx
├── components/
│   ├── admin/                   # EmptyState, StatsCard
│   ├── animations/              # CountUp, FallingPetals, ParallaxSection, ScrollFade
│   ├── editor/
│   │   ├── EditorPanel.tsx
│   │   ├── PreviewPanel.tsx
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   └── tabs/               # BasicInfoTab, GalleryTab, AccountTab 등 7개
│   ├── invitation/
│   │   └── InvitationCard.tsx
│   ├── landing-a/               # HeroElegant, TemplateCarousel 등
│   ├── landing-b/               # HeroSplit, VideoSection 등
│   ├── landing-c/               # BeforeAfter, ScrollStory 등
│   ├── layout/                  # DashboardNav, Header, Footer, UserProfile
│   ├── marketing/               # Hero, Features, Pricing
│   ├── providers/               # SessionProvider
│   ├── templates/
│   │   ├── ClassicTemplate.tsx
│   │   ├── ModernTemplate.tsx
│   │   └── GalleryLightbox.tsx
│   └── ui/                      # 커스텀 컴포넌트 (Button, Card, DatePicker 등)
├── lib/
│   ├── ai/                      # AI 관련 모듈
│   │   ├── constants.ts         # AI 관련 상수
│   │   ├── credits.ts           # 크레딧 관리
│   │   ├── env.ts               # 환경변수
│   │   ├── face-detection.ts    # Azure Face API
│   │   ├── image-optimizer.ts   # Sharp WebP 최적화
│   │   ├── logger.ts            # AI 전용 로거
│   │   ├── models.ts            # AI 모델 정의 (Flux Pro/Dev, PhotoMaker)
│   │   ├── rate-limit.ts        # Upstash Rate limiting
│   │   ├── replicate.ts         # Replicate API 클라이언트
│   │   ├── s3.ts                # AWS S3 업로드/삭제
│   │   └── validation.ts        # 입력 검증
│   ├── api-utils.ts             # API 헬퍼
│   ├── utils.ts                 # 공통 유틸
│   └── utils/
│       └── date.ts              # 날짜 유틸
├── schemas/                     # Zod 스키마
│   ├── ai.ts
│   ├── common.ts
│   ├── index.ts
│   ├── invitation.ts
│   ├── payment.ts
│   ├── rsvp.ts
│   └── user.ts
├── types/                       # TypeScript 타입 정의
│   ├── ai.ts
│   └── next-auth.d.ts
├── db/
│   ├── schema.ts                # Drizzle 스키마
│   ├── index.ts                 # DB 클라이언트
│   ├── seed.ts                  # 시드 데이터
│   └── migrations/
└── package.json
```

## 핵심 파일 (Critical Files)

### 1. `/db/schema.ts`

Drizzle ORM 스키마 (8개 테이블):

```typescript
// User (id, email, name, image, role, premiumPlan, aiCredits, emailNotifications)
// Template (id, name, category, tier, thumbnail, config, isActive)
// Invitation (id, userId, templateId, groomName, brideName, weddingDate, venueName,
//             venueAddress, introMessage, galleryImages[], aiPhotoUrl,
//             isPasswordProtected, passwordHash, viewCount, status, expiresAt)
// RSVP (id, invitationId, guestName, guestPhone, guestEmail, attendance,
//        guestCount, mealOption, message)
// AIGeneration (id, userId, originalUrl, style, generatedUrls[], selectedUrl,
//               status, creditsUsed, cost, replicateId, completedAt)
// Payment (id, userId, type, method, amount, creditsGranted, status, orderId, paymentKey)
// Account (NextAuth OAuth - provider, providerAccountId, tokens)
// Session (NextAuth 세션 관리)
```

### 2. `/lib/ai/replicate.ts`

AI 사진 생성 로직:

```typescript
export async function generateWeddingPhoto(params: {
  imageUrl: string;
  style: string;
  model: string;    // flux-pro | flux-dev | photomaker
  role?: string;    // GROOM | BRIDE
}): Promise<string[]>
// 1. 모델별 프롬프트 생성 (역할 기반)
// 2. Replicate API 호출
// 3. 배치 생성 (4장)
// 4. S3 영구 저장 (Replicate CDN → S3 복사)
// 5. CloudFront/S3 URL 반환
```

### 3. `/lib/ai/models.ts`

AI 모델 정의:

```typescript
AI_MODELS = {
  FLUX_PRO:    { costPerImage: 0.04,   facePreservation: 'fair',      speed: 'fast' },
  FLUX_DEV:    { costPerImage: 0.025,  facePreservation: 'fair',      speed: 'fast' },
  PHOTOMAKER:  { costPerImage: 0.0095, facePreservation: 'excellent', speed: 'medium' },
}
```

### 4. `/app/api/ai/generate/route.ts`

AI 생성 API 엔드포인트:

- 인증 확인 (NextAuth 세션)
- Rate limiting (Upstash, 10분당 5회)
- 크레딧 확인 및 차감
- Replicate API 호출 (모델/스타일/역할)
- S3 영구 저장
- 생성 이력 DB 저장

### 5. 편집기 구조

탭 기반 폼 편집기:

- `components/editor/EditorPanel.tsx` - 편집 탭 렌더링
- `components/editor/PreviewPanel.tsx` - 실시간 미리보기
- `components/editor/tabs/` - 7개 탭 (BasicInfo, Greeting, Gallery, Account, Venue, Settings, Template)
- `components/editor/Sidebar.tsx` + `TopBar.tsx` - 네비게이션

## 디자인 접근

### 독자적 템플릿 개발

- **오픈소스 복사 없이 완전히 새로운 디자인**
- AI 사진 생성에 최적화된 레이아웃
- 모바일 우선 설계 (90%+ 모바일 트래픽)

### 디자인 가이드라인

1. **클래식** - 전통적인 한국식 청첩장, 세리프 폰트 ✅ 구현됨
2. **모던** - 미니멀, 대담한 타이포그래피 (컴포넌트 존재)
3. **빈티지** - 복고풍, 따뜻한 색감 ❌ 미구현
4. **플로럴** - 꽃무늬 일러스트, 부드러운 파스텔 ❌ 미구현
5. **미니멀** - 흑백, 여백 강조 ❌ 미구현

### UI 컴포넌트

- **커스텀 빌드** (Button, Card, DatePicker, TimePicker, ConfirmDialog)
- Framer Motion 애니메이션 패턴
- Next.js Image 최적화

## 비용 예측 (MVP 3개월)

### 개발 비용

- 개발자 1명 (풀타임) - 자체 개발
- 디자이너 (외주) - 템플릿 5개: 100만원
- 총 인건비: 약 1,000만원 (3개월)

### 운영 비용 (월)

- Vercel: 무료 (Hobby 플랜)
- Supabase: 무료 (10GB)
- AWS S3 + CloudFront: 소규모 무료 티어 범위 내
- Upstash Redis: 무료 (10K commands/day)
- Replicate AI: 사용량 기반 (모델별 $0.0095~$0.04/이미지)
  - 예상: 월 200회 생성 = $2~$8 (약 3천~1만원)
- 도메인: 2만원/년
- 총: 약 5만원/월

### 손익분기점

- 프리미엄 전환율 20% 가정
- 월 50명 가입 → 10명 프리미엄 구매
- 월 매출: 10명 × 9,900원 = 99,000원
- 손익분기점: 약 6개월 (운영비만 고려)

## 성공 지표 (KPI)

### MVP 출시 후 3개월

- 신규 가입: 1,000명
- 청첩장 생성: 500개
- 프리미엄 전환율: 20% (100명)
- AI 생성: 200회
- 월 매출: 100만원

### 1년 목표

- 신규 가입: 10,000명
- 월 매출: 1,000만원
- AI 생성: 5,000회/월

## 위험 요소 및 대응

### 1. AI 생성 품질 이슈

- 대응: 배치 4장 생성, 재생성 기능, 프롬프트 개선, "만족 보장" 정책
- 모델 선택지 제공 (PhotoMaker = 얼굴 보존 우수)

### 2. 비용 예측 불가

- 대응: 크레딧 제한, 비용 모니터링, 대량 시 self-hosted 전환

### 3. 피싱 공격 악용

- 대응: URL 검증, HTTPS 강제, 피싱 신고, 계정 모니터링

### 4. 경쟁사 대응

- 대응: 빠른 출시(3개월), AI 품질 개선, 커뮤니티 구축

## 검증 방법

### 1. 기능 검증

- 청첩장 생성 → 편집 → 공유 → RSVP 응답 → 통계 확인 (E2E)
- AI 사진 생성: 증명 사진 업로드 → 모델/스타일/역할 선택 → 4장 생성 → 선택
- 결제: 프리미엄 구매 → 크레딧 충전 → AI 생성 횟수 확인

### 2. 성능 검증

- Lighthouse 점수 90점 이상
- 모바일 First Contentful Paint < 1.8초
- 이미지 최적화 (WebP, lazy loading)

### 3. 보안 검증

- HTTPS 강제 확인
- Rate limiting 테스트 (10분당 5회 제한)
- 피싱 시나리오 테스트

### 4. 베타 테스트

- 50명 초대 (친구, 가족, 온라인 커뮤니티)
- 피드백 수집: AI 사진 품질, 편집기 UX, 템플릿 디자인
- 버그 수정

## Phase 2 확장 기능 (출시 후 3-6개월)

### 인프라 강화
1. **NestJS AI 마이크로서비스** (Backend 개발자 추가)
   - ComfyUI self-hosting (GPU 서버)
   - AI 모델 fine-tuning (LoRA)
   - 비용 최적화 (월 1000장 이상 시)

### 기능 확장
2. 축의금 송금 (Toss/카카오페이 버튼)
3. 애니메이션 효과 (눈, 벚꽃, 낙엽)
4. 커스텀 폰트 업로드
5. AI 문구 추천 (GPT-4 Turbo)
6. 신혼 가전 펀딩
7. 카카오톡 알림톡 (RSVP 응답 알림)
8. 드래그 앤 드롭 편집기 (dnd-kit)

## 다음 우선순위 (MVP 완성)

출시에 필요한 미구현 기능 (우선순위순):

1. **공개 청첩장 뷰 (`inv/[id]/`)** - 공유 가능한 청첩장 페이지
2. **RSVP 게스트 폼** - 공개 페이지에서 참석 여부 제출
3. **Toss Payments 연동** - 프리미엄 구매 + AI 크레딧 충전
4. **카카오톡 공유** - Open Graph 메타 + 공유 버튼
5. **추가 템플릿** - Modern, Vintage, Floral, Minimal
6. **주소 검색** - 카카오맵 연동 (설계 문서 있음)

### Next.js 16 주의사항

- 모든 페이지/레이아웃은 `async function`으로 작성
- `params`는 Promise이므로 `await params` 필수
- 예: `const { id } = await params`
