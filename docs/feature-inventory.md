# Cuggu 기능 목록 (Feature Inventory)

> 최종 업데이트: 2026-02-09

---

## 1. 인증 & 유저 관리

| 기능 | 상태 | 비고 |
|---|---|---|
| 카카오 로그인 | ✅ 완료 | NextAuth v5 OAuth |
| 네이버 로그인 | ✅ 완료 | NextAuth v5 OAuth |
| 유저 프로필 조회 | ✅ 완료 | 이메일, 이름, 이미지, 플랜 |
| 유저 설정 | ✅ 완료 | 이메일 알림 토글 |
| AI 크레딧 잔액 표시 | ✅ 완료 | 대시보드 설정 페이지 |
| 이메일 로그인 | ❌ 미구현 | Placeholder만 존재 |

**핵심 파일**: `app/(auth)/login/`, `app/api/auth/[...nextauth]/`, `app/api/user/`

---

## 2. 청첩장 CRUD

| 기능 | 상태 | 비고 |
|---|---|---|
| 청첩장 생성 | ✅ 완료 | 템플릿 선택 후 생성 |
| 청첩장 목록 조회 | ✅ 완료 | 페이지네이션, 그리드 UI |
| 청첩장 수정 | ✅ 완료 | 에디터를 통한 수정 |
| 청첩장 삭제 | ✅ 완료 | 확인 다이얼로그 포함 |
| 상태 관리 | ✅ 완료 | DRAFT / PUBLISHED / EXPIRED |
| 썸네일 미리보기 | ✅ 완료 | 목록 카드에 표시 |

**핵심 파일**: `app/api/invitations/`, `app/dashboard/invitations/`

---

## 3. 비주얼 에디터

3패널 Figma 스타일 레이아웃: 사이드바(탭) | 폼 에디터 | 라이브 미리보기

### 3.1 에디터 탭

| 탭 | 기능 | 상태 |
|---|---|---|
| 기본정보 | 신랑/신부 이름, 부모, 관계(장남/차남 등), 연락처 | ✅ 완료 |
| 예식장 | 이름, 주소, 시간, 좌표, 카카오맵 연동 | ✅ 완료 |
| 인사말 | 환영 메시지 편집 | ✅ 완료 |
| 갤러리 | 수동 업로드 + AI 사진 생성 연동 | ✅ 완료 |
| 계좌 | 신랑/신부측 은행, 계좌번호, 예금주 | ✅ 완료 |
| 설정 | 비밀번호 보호, RSVP 활성화, 만료일, 테마 | ✅ 완료 |
| RSVP 관리 | 응답 목록, 필터, 통계, 삭제 | ✅ 완료 |
| 템플릿 선택 | 템플릿 갤러리 + AI 테마 생성 | ✅ 완료 |

### 3.2 에디터 인프라

| 기능 | 상태 | 비고 |
|---|---|---|
| Zustand 상태 관리 | ✅ 완료 | 실시간 동기화 |
| 자동 저장 | ✅ 완료 | 상태 인디케이터 표시 |
| 뷰 모드 선택기 | ✅ 완료 | Desktop / Mobile / Phone |

**핵심 파일**: `app/editor/[id]/`, `components/editor/`, `stores/invitation-editor.ts`

---

## 4. 템플릿 시스템

### 4.1 템플릿 종류

| 템플릿 | 카테고리 | 티어 |
|---|---|---|
| Classic | CLASSIC | FREE |
| Modern | MODERN | FREE |
| Minimal | MINIMAL | FREE |
| Elegant | CLASSIC | PREMIUM |
| Floral | FLORAL | PREMIUM |
| Natural | CLASSIC | PREMIUM |

### 4.2 섹션 컴포넌트

| 섹션 | 설명 |
|---|---|
| CoverSection | 제목, 이름, 날짜 |
| GreetingSection | 인사말 |
| ParentsSection | 양가 부모님 (표시 모드 지원) |
| CeremonySection | 예식 시간/장소 |
| GallerySection | 사진 갤러리 + 라이트박스 |
| MapInfoSection | 카카오맵 위치 |
| AccountsSection | 축의금 계좌 |
| RsvpSectionWrapper | RSVP 폼 |
| DDayWidget | 디데이 카운트다운 |

### 4.3 AI 테마 생성

| 기능 | 상태 | 비고 |
|---|---|---|
| 프롬프트 기반 테마 생성 | 🔧 진행중 | Claude Sonnet 4.5 tool_use |
| Tailwind CSS 기반 출력 | 🔧 진행중 | Zod 스키마 검증 |
| Safelist 검증 | 🔧 진행중 | 허용된 클래스만 통과 |
| 테마 저장/삭제 | 🔧 진행중 | aiThemes 테이블 |
| 레이트 리밋 (10회/시간) | ✅ 완료 | |

**핵심 파일**: `components/templates/`, `lib/ai/theme-generation.ts`, `lib/templates/safelist.ts`

---

## 5. 공개 청첩장 뷰

| 기능 | 상태 | 비고 |
|---|---|---|
| 공개 페이지 렌더링 | ✅ 완료 | `/inv/[id]` |
| OG 메타태그 (소셜 공유) | ✅ 완료 | 카카오톡/SNS 미리보기 |
| 조회수 카운트 | ✅ 완료 | 방문 시 자동 증가 |
| 비밀번호 보호 | ✅ 완료 | 비밀번호 게이트 컴포넌트 |
| 소유자 미리보기 | ✅ 완료 | `/preview/[id]` (조회수 미카운트) |
| 카카오톡 공유 | ✅ 완료 | Share bar |
| 템플릿 미리보기 | ✅ 완료 | `/templates/preview` |

**핵심 파일**: `app/inv/[id]/`, `app/preview/[id]/`

---

## 6. AI 사진 생성

### 6.1 핵심 기능

| 기능 | 상태 | 비고 |
|---|---|---|
| 사진 업로드 | ✅ 완료 | JPG/PNG, 크기 제한 |
| 얼굴 감지 검증 | ✅ 완료 | 얼굴 없는 이미지 차단 |
| 4장 배치 생성 | ✅ 완료 | 1회 요청 = 4장 |
| 이미지 선택/적용 | ✅ 완료 | 신랑/신부별 |
| 재생성 | ✅ 완료 | |
| 스트리밍 생성 | 🔧 부분 | 인프라만 준비 |

### 6.2 AI 스타일 (10종)

| 스타일 | 설명 |
|---|---|
| CLASSIC_STUDIO | 클래식 스튜디오 |
| OUTDOOR_GARDEN | 야외 정원 |
| SUNSET_BEACH | 노을 해변 |
| TRADITIONAL_HANBOK | 전통 한복 |
| VINTAGE_CINEMATIC | 빈티지 시네마틱 |
| LUXURY_HOTEL | 럭셔리 호텔 |
| CITY_LIFESTYLE | 도시 라이프스타일 |
| ENCHANTED_FOREST | 숲속 |
| BLACK_AND_WHITE | 흑백 |
| MINIMALIST_GALLERY | 미니멀리스트 |

### 6.3 AI 모델

| 모델 | 제공자 | 비용/장 |
|---|---|---|
| Flux Pro | Black Forest Labs | $0.04 |
| Flux Dev | Black Forest Labs | $0.025 |
| PhotoMaker | Tencent | $0.0095 |
| GPT Image 1 | OpenAI | $0.04 |
| DALL-E 3 | OpenAI | 설정 가능 |

**핵심 파일**: `app/dashboard/ai-photos/`, `app/api/ai/generate/`, `lib/ai/`

---

## 7. RSVP 시스템

### 7.1 게스트 RSVP 폼

| 필드 | 필수 | 설정 가능 |
|---|---|---|
| 이름 | ✅ | - |
| 참석 여부 (참석/불참/미정) | ✅ | - |
| 전화번호 | ❌ | ✅ on/off |
| 동행 인원 | ❌ | ✅ on/off |
| 식사 (성인/아동/채식/없음) | ❌ | ✅ on/off |
| 메시지 | ❌ | ✅ on/off |

### 7.2 RSVP 관리

| 기능 | 상태 | 비고 |
|---|---|---|
| RSVP 제출 | ✅ 완료 | 1회 제출 + 확인 |
| RSVP 대시보드 | ✅ 완료 | `/dashboard/rsvp` |
| 참석 통계 | ✅ 완료 | 참석/불참/미정 카운트 |
| 식사 집계 | ✅ 완료 | |
| 인원수 합계 | ✅ 완료 | |
| 개별 삭제 | ✅ 완료 | |
| 게스트 정보 암호화 | ✅ 완료 | 전화번호/이메일 |

**핵심 파일**: `components/rsvp/`, `app/api/invitations/[id]/rsvp/`, `app/dashboard/rsvp/`

---

## 8. 결제 & 크레딧

| 기능 | 상태 | 비고 |
|---|---|---|
| 크레딧 잔액 조회 | ✅ 완료 | |
| 크레딧 차감 (트랜잭션) | ✅ 완료 | 레이스 컨디션 방지 |
| 크레딧 환불 (실패 시) | ✅ 완료 | |
| 신규 유저 기본 2크레딧 | ✅ 완료 | |
| 결제 DB 스키마 | ✅ 완료 | payments 테이블 |
| 결제 이력 조회 | ✅ 완료 | |
| **Toss 결제 연동** | ❌ 미구현 | DB 준비만 완료 |
| **카카오페이 연동** | ❌ 미구현 | DB 준비만 완료 |

**결제 유형**: PREMIUM_UPGRADE, AI_CREDITS, AI_CREDITS_BUNDLE
**결제 수단**: TOSS, KAKAO_PAY, CARD

**핵심 파일**: `lib/ai/credits.ts`, `app/api/user/credits/`, `app/api/payments/`

---

## 9. 어드민 패널

| 기능 | 상태 | 비고 |
|---|---|---|
| 대시보드 통계 | ✅ 완료 | 유저/생성/청첩장/매출 |
| 유저 관리 | ✅ 완료 | 검색, 크레딧 부여, 플랜 변경 |
| 결제 관리 | ✅ 완료 | 필터, 페이지네이션, 합계 |
| AI 모델 관리 | ✅ 완료 | 활성화, 추천, 정렬 |

**핵심 파일**: `app/admin/`

---

## 10. 마케팅 & 랜딩

| 기능 | 상태 | 비고 |
|---|---|---|
| 메인 랜딩 페이지 | ✅ 완료 | `/` |
| 랜딩 A (우아한 꽃 디자인) | ✅ 완료 | `/landing-a` |
| 랜딩 B (스플릿 히어로 + 비디오) | ✅ 완료 | `/landing-b` |
| 랜딩 C (Before/After 쇼케이스) | ✅ 완료 | `/landing-c` |
| 가격표 섹션 | ✅ 완료 | Free / Premium |

**섹션**: HeroImpact, BeforeAfterGallery, ProblemSolution, HowItWorks, SecurityTrust, SocialProof, Pricing, FinalCTA

---

## 11. 인프라 & 유틸리티

| 기능 | 상태 | 비고 |
|---|---|---|
| S3 + CloudFront 이미지 저장 | ✅ 완료 | 업로드/복사 |
| 이미지 최적화 | ✅ 완료 | 크기/포맷 검증 |
| Upstash Redis 레이트 리밋 | ✅ 완료 | |
| 카카오맵 주소 검색 | ✅ 완료 | 자동완성 + 역지오코딩 |
| 카카오톡 공유 | ✅ 완료 | |
| 게스트 정보 암호화 | ✅ 완료 | AES 암호화 |
| Zod 스키마 검증 | ✅ 완료 | 7개 도메인 |

---

## 12. DB 테이블

| 테이블 | 용도 |
|---|---|
| users | 유저 계정 + 플랜 + 크레딧 |
| accounts | NextAuth OAuth 계정 |
| sessions | NextAuth 세션 |
| templates | 청첩장 템플릿 설정 |
| invitations | 청첩장 데이터 (핵심) |
| rsvps | 게스트 RSVP 응답 |
| aiGenerations | AI 사진 생성 이력 |
| aiThemes | AI 생성 테마 |
| aiModelSettings | AI 모델 관리자 설정 |
| payments | 결제 트랜잭션 |
| appSettings | 글로벌 앱 설정 |

---

## 완성도 요약

```
인증/유저       ████████████████████ 100%
청첩장 CRUD     ████████████████████ 100%
비주얼 에디터   ████████████████████ 100%
템플릿          ████████████████░░░░  80%  (AI 테마 진행중)
공개 뷰        ████████████████████ 100%
AI 사진 생성    ██████████████████░░  90%  (스트리밍 부분)
RSVP           ████████████████████ 100%
결제            ████████░░░░░░░░░░░░  40%  (연동 미구현)
어드민          ████████████████████ 100%
마케팅          ████████████████████ 100%
인프라          ████████████████████ 100%
```

### 미구현 핵심 기능

1. **Toss/카카오페이 결제 연동** — DB 스키마만 준비, 실제 PG 연동 없음
2. **AI 테마 생성 완성** — 생성 로직은 있으나 에디터 통합 진행 중
3. **이메일 로그인** — Placeholder만 존재
4. **AI 사진 스트리밍** — 인프라만 준비
