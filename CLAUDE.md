# 모바일 청첩장 플랫폼 "Cuggu" 구현 계획

## 프로젝트 개요

완전히 새로운 상업적 모바일 청첩장 플랫폼을 개발합니다. 한국 시장을 타겟으로 하며, **AI 사진 생성**을 핵심 차별화 포인트로 합니다.

## 핵심 차별화 포인트

### 1. AI 웨딩 사진 자동 생성 (핵심)

- 증명 사진만 업로드하면 웨딩 컨셉에 맞는 AI 사진 4장 자동 생성
- 웨딩 화보 촬영 비용(수십만원~수백만원) 절감
- Replicate API + Flux 모델 사용 ($0.04/이미지)
- 크레딧 시스템: 무료 2회, 프리미엄 10회

### 2. 보안과 신뢰성

- 피싱 공격 1,189% 증가 대응
- nanoid URL 암호화
- HTTPS 강제, Rate limiting
- 결혼식 후 자동 삭제 (90일)

### 3. 완전한 커스터마이징

- 드래그 앤 드롭 편집기
- 오픈소스 기반 (MIT 라이선스)
- 개발자도 코드 레벨 수정 가능

### 4. 통합 플랫폼

- 청첩장 + RSVP + 하객 관리 + AI 사진 생성

## 기술 스택

### Frontend

- **Next.js 16** (App Router) + TypeScript
  - Turbopack 기본 탑재 (빠른 빌드)
  - Async params/id 패턴 (모든 params는 await 필요)
- **Tailwind CSS** (순수 Tailwind, UI 라이브러리 없음)
- **Framer Motion** (애니메이션 효과)
- **dnd-kit** (드래그 앤 드롭 편집기)
- **Zustand** (상태 관리)

### Backend

**Phase 1 (MVP): Full-stack Developer 1명**
- **Next.js API Routes** (청첩장 CRUD, RSVP, 인증)
- **Replicate API** (AI 사진 생성 - 외부 API)
- **NextAuth.js v5** (카카오/네이버/이메일 로그인)
- **AI 서비스 분리 설계** (`/api/ai/*` endpoint)

**Phase 2 (출시 후): Backend 개발자 추가**
- **NestJS 마이크로서비스** (AI 전담)
  - ComfyUI self-hosting (GPU 서버)
  - AI 모델 fine-tuning (LoRA)
  - 이미지 처리 파이프라인
- **마이그레이션**: `/api/ai/*` → NestJS 서비스

### AI 사진 생성

- **Replicate API** (Flux 모델)
- **Azure Face API** (얼굴 감지, 무료 티어)
- 파이프라인:
  1. 증명 사진 업로드 → 얼굴 감지
  2. 웨딩 스타일 선택 (클래식/모던/빈티지)
  3. Replicate로 4장 생성 (배치)
  4. 사용자 선택 및 적용

### Database & Storage

- **PostgreSQL** (Supabase - 10GB 무료)
- **Drizzle ORM** (타입 안전, Serverless 최적화)
- **Cloudflare R2** (파일 스토리지, 송신 무료)
- **Redis** (Upstash - 캐싱, Rate limiting)

### Deployment

- **Vercel** (Frontend + API)
- **Railway** (마이크로서비스)
- **Cloudflare CDN**

### Payment

- **Toss Payments** (주력)
- **Kakao Pay** (서브)

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

## MVP 기능 (3개월 출시 목표)

### Month 1: 기반 구축

**Week 1-2: 프로젝트 설정**

- Next.js 16 + TypeScript 프로젝트 초기화
- Drizzle ORM + Supabase 연동
- NextAuth.js 카카오 로그인
- shadcn/ui 컴포넌트 설정
- async params 패턴 이해 및 적용

**Week 3-4: 청첩장 생성**

- 5개 기본 템플릿 개발
- 드래그 앤 드롭 편집기 (dnd-kit)
- 실시간 미리보기
- CRUD API

### Month 2: 핵심 기능

**Week 5-6: AI 사진 생성 (핵심 차별화)**

- Replicate API 연동
- Azure Face API 얼굴 감지
- 배치 생성 (4장) UI
- 크레딧 시스템 (무료 2회, 프리미엄 10회)
- 선택 및 청첩장 적용

**Week 7-8: RSVP 및 공유**

- RSVP 폼 (참석 여부, 동행 인원, 축하 메시지)
- 통계 대시보드 (참석률, 예상 인원)
- 엑셀 다운로드
- 카카오톡 공유 (Open Graph)
- QR 코드 생성

### Month 3: 결제 및 출시

**Week 9-10: 결제**

- Toss Payments 연동
- 프리미엄 플랜 구매 (9,900원)
- AI 크레딧 추가 구매 (1,000원/회)

**Week 11-12: 보안 및 출시**

- nanoid URL 암호화
- Rate limiting (Upstash)
- 이미지 최적화 (Cloudflare)
- 성능 테스트 (Lighthouse 90점+)
- 베타 테스트 50명
- 정식 출시

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
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/
│   │   ├── invitations/
│   │   ├── ai-photos/
│   │   └── settings/
│   ├── inv/[id]/          # 청첩장 조회 페이지
│   ├── editor/[id]/       # 청첩장 편집기
│   ├── api/
│   │   ├── auth/
│   │   ├── invitations/
│   │   ├── rsvp/
│   │   ├── ai/              # Phase 2: NestJS 마이크로서비스로 분리 예정
│   │   │   └── generate/   # AI 사진 생성 API (Replicate)
│   │   ├── payment/
│   │   │   └── toss/
│   │   └── upload/
│   └── layout.tsx
├── components/
│   ├── editor/
│   │   ├── InvitationEditor.tsx  # 드래그 앤 드롭 편집기
│   │   ├── TemplateSelector.tsx
│   │   └── PreviewPanel.tsx
│   ├── ai/
│   │   ├── AIPhotoGenerator.tsx  # AI 사진 생성 UI
│   │   └── StyleSelector.tsx
│   ├── templates/
│   │   ├── ClassicTemplate.tsx
│   │   ├── ModernTemplate.tsx
│   │   └── VintageTemplate.tsx
│   └── ui/                 # shadcn/ui 컴포넌트
├── lib/
│   ├── replicate.ts        # Replicate API 클라이언트 (Phase 2: 제거 예정)
│   ├── face-detection.ts   # Azure Face API (Phase 2: NestJS로 이동)
│   └── auth.ts
├── db/
│   ├── schema.ts           # Drizzle 스키마
│   ├── index.ts            # DB 클라이언트
│   └── migrations/         # 마이그레이션 파일
├── public/
│   ├── templates/
│   └── fonts/
└── package.json
```

## 핵심 파일 (Critical Files)

### 1. `/db/schema.ts`

Drizzle ORM 스키마:

```typescript
// User, Invitation, RSVP, AIGeneration, Payment 테이블
// - User (id, email, isPremium, aiCredits)
// - Invitation (id, userId, templateId, weddingDate, galleryImages, aiPhotoUrl)
// - RSVP (id, invitationId, name, attendance, guestCount)
// - AIGeneration (id, userId, originalUrl, generatedUrls, style, cost)
// - Payment (id, userId, amount, type, credits)
```

### 2. `/lib/replicate.ts`

AI 사진 생성 로직:

```typescript
export async function generateWeddingPhoto(
  imageFile: File,
  style: "classic" | "modern" | "vintage",
): Promise<string[]> {
  // 1. 얼굴 감지
  // 2. Replicate API 호출 (Flux 모델)
  // 3. 배치 생성 (4장)
  // 4. S3/R2 업로드
  // 5. URL 반환
}
```

### 3. `/app/api/ai/generate/route.ts`

AI 생성 API 엔드포인트:

- 크레딧 확인 및 차감
- Replicate API 호출
- 생성 이력 저장

### 4. `/components/editor/InvitationEditor.tsx`

드래그 앤 드롭 편집기:

- dnd-kit 사용
- 실시간 미리보기
- 텍스트/이미지 편집

### 5. `/app/api/payment/toss/route.ts`

Toss Payments 연동:

- 결제 요청 및 승인
- 크레딧 충전

## 디자인 접근

### 독자적 템플릿 개발

- **오픈소스 복사 없이 완전히 새로운 디자인**
- Figma로 5개 템플릿 디자인 (디자이너 협업)
- AI 사진 생성에 최적화된 레이아웃
- 모바일 우선 설계 (90%+ 모바일 트래픽)

### 디자인 가이드라인

1. **클래식** - 전통적인 한국식 청첩장, 세리프 폰트
2. **모던** - 미니멀, 대담한 타이포그래피
3. **빈티지** - 복고풍, 따뜻한 색감
4. **플로럴** - 꽃무늬 일러스트, 부드러운 파스텔
5. **미니멀** - 흑백, 여백 강조

### 기술 참고 (코드만)

- shadcn/ui 컴포넌트 (버튼, 폼 등)
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
- Cloudflare R2: 무료 (10GB)
- Upstash Redis: 무료 (10K commands/day)
- Replicate AI: 사용량 기반 ($0.04/이미지)
  - 예상: 월 200회 생성 = $8 (약 1만원)
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

### 2. 비용 예측 불가

- 대응: 크레딧 제한, 비용 모니터링, 대량 시 self-hosted 전환

### 3. 피싱 공격 악용

- 대응: URL 검증, HTTPS 강제, 피싱 신고, 계정 모니터링

### 4. 경쟁사 대응

- 대응: 빠른 출시(3개월), AI 품질 개선, 커뮤니티 구축

## 검증 방법

### 1. 기능 검증

- 청첩장 생성 → 편집 → 공유 → RSVP 응답 → 통계 확인 (E2E)
- AI 사진 생성: 증명 사진 업로드 → 스타일 선택 → 4장 생성 → 선택
- 결제: 프리미엄 구매 → 크레딧 충전 → AI 생성 횟수 확인

### 2. 성능 검증

- Lighthouse 점수 90점 이상
- 모바일 First Contentful Paint < 1.8초
- 이미지 최적화 (WebP, lazy loading)

### 3. 보안 검증

- HTTPS 강제 확인
- Rate limiting 테스트 (10초당 5회 제한)
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

## 다음 단계 (구현 시작)

1. **Next.js 16 프로젝트 초기화**

   ```bash
   npx create-next-app@latest cuggu --typescript --tailwind --app
   # Turbopack 자동 활성화됨
   ```

2. Drizzle ORM 설정 및 DB 스키마 작성
3. Supabase 프로젝트 생성 및 연동
4. NextAuth.js 카카오 로그인 설정
5. 첫 번째 템플릿 개발 (클래식)
6. 드래그 앤 드롭 편집기 프로토타입

### Next.js 16 주의사항

- 모든 페이지/레이아웃은 `async function`으로 작성
- `params`는 Promise이므로 `await params` 필수
- 예: `const { id } = await params`
