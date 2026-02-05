# Cuggu 프로젝트 구조

> 이 문서는 CLAUDE.md에서 분리된 상세 프로젝트 구조입니다.

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

## DB 스키마 (8개 테이블)

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

## 디자인 가이드라인

1. **클래식** - 전통적인 한국식 청첩장, 세리프 폰트 ✅ 구현됨
2. **모던** - 미니멀, 대담한 타이포그래피 (컴포넌트 존재)
3. **빈티지** - 복고풍, 따뜻한 색감 ❌ 미구현
4. **플로럴** - 꽃무늬 일러스트, 부드러운 파스텔 ❌ 미구현
5. **미니멀** - 흑백, 여백 강조 ❌ 미구현
