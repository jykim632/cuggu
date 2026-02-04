# 대시보드 설정 페이지 구현 및 NextAuth 세션 이슈 해결

> **작업일**: 2026-02-04
> **브랜치**: `feature/settings-page`
> **상태**: 진행 중 (API 연동 완료, 테스트 대기)

---

## 작업한 내용

### 1. 청첩장 편집 버튼 새 탭 열기
- **문제**: 대시보드에서 "편집하기" 클릭 시 현재 탭에서 이동 → 대시보드 상태 유실
- **해결**: `window.open()` + `target="_blank"` 사용
- **변경 파일**: `components/invitation/InvitationCard.tsx`
  - 호버 시 Edit 아이콘: `router.push` → `window.open`
  - 하단 "편집하기 →" 링크: `<Link target="_blank" rel="noopener noreferrer">`

### 2. 설정 페이지 UI 구현
- **위치**: `/dashboard/settings`
- **섹션**:
  1. **계정 정보**: 이메일, 이름, 가입일, 플랜 (무료/프리미엄)
  2. **AI 크레딧**: 남은 크레딧, 프로그레스 바, 크레딧 구매 옵션
  3. **알림 설정**: 이메일 알림 토글 (실제 동작), 카카오톡 알림 (준비 중)
  4. **결제 내역**: 결제 목록, 영수증 다운로드
  5. **계정 관리**: 비밀번호 변경, 계정 삭제 (UI만)
- **디자인**: 기존 대시보드와 일관성 유지 (Gradient, ScrollFade 애니메이션)

### 3. DB 스키마 확장
- **추가 필드**: `users.emailNotifications` (boolean, default: true)
- **마이그레이션**: `db/migrations/0002_wandering_roulette.sql`
- **Supabase 적용**:
  ```sql
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_notifications" boolean DEFAULT true NOT NULL;
  ```

### 4. API 엔드포인트 3개 생성
#### a. `GET /api/user/profile`
- 현재 로그인 사용자 프로필 조회
- 반환: email, name, image, premiumPlan, aiCredits, emailNotifications, createdAt

#### b. `PATCH /api/user/settings`
- 설정 업데이트 (현재는 emailNotifications만 지원)
- Zod 스키마 검증
- NextAuth v5 `auth()` 사용

#### c. `GET /api/payments/history`
- 결제 내역 조회 (최근 20개)
- 타입별 설명 매핑 (PREMIUM_UPGRADE → "프리미엄 플랜")

### 5. NextAuth v5 마이그레이션
- **문제**: `getServerSession` 함수가 v5에서 제거됨
- **해결**: `auth()` 함수로 변경
- **영향받은 파일**:
  - `app/api/user/profile/route.ts`
  - `app/api/user/settings/route.ts`
  - `app/api/payments/history/route.ts`

### 6. 설정 페이지 데이터 연동
- `useEffect`로 초기 데이터 로딩
- 이메일 알림 토글 시 API 호출 (`PATCH /api/user/settings`)
- 낙관적 업데이트 (Optimistic UI)
- 에러 핸들링 (alert로 피드백)

---

## 왜 했는지 (맥락)

### 청첩장 편집 새 탭 열기
- 사용자가 대시보드에서 여러 청첩장을 관리할 때, 편집 후 다시 대시보드로 돌아오는 플로우가 자연스럽지 않음
- 새 탭으로 열면 대시보드 상태 유지 + 편집기 집중 가능

### 설정 페이지 필요성
- MVP 우선순위는 아니지만 **사용자 경험** 측면에서 필수
- 알림 설정, 플랜 관리, 결제 내역 등 기본적인 계정 관리 기능
- 나중에 프리미엄 플랜 출시 시 업그레이드 버튼 위치로 활용

### NextAuth v5 대응
- 기존 예제 코드가 v4 기반이었는데, 프로젝트는 v5 사용
- `getServerSession`이 deprecated되어 모든 API에서 마이그레이션 필요

---

## 논의/아이디어/고민

### 1. NextAuth vs Supabase Auth Sessions 충돌
- **문제**: Drizzle 마이그레이션 시 `sessions` 테이블이 충돌
  - NextAuth: 3개 컬럼 (sessionToken, userId, expires)
  - Supabase Auth: 18개 컬럼 (id, factor_id, aal, refresh_token_hmac_key 등)
- **원인**: 같은 테이블을 두 시스템이 사용하려고 시도
- **임시 해결**: `users` 테이블만 마이그레이션, sessions는 Supabase Auth 사용
- **영구 해결 (Phase 2)**:
  - Option 1: `nextauth_sessions` 테이블로 분리 (추천)
  - Option 2: Auth 스키마 분리 (public vs auth)
  - Option 3: Supabase Auth 비활성화

### 2. 설정 페이지 구조
- **초기 계획**: 간단한 폼 페이지
- **최종 구현**: 섹션별 분리 + 시각적 계층 강조
  - 계정 정보: 흰색 배경
  - AI 크레딧: 그라데이션 배경 (핑크/보라/블루)
  - 알림/결제/계정 관리: 흰색 배경
- **이유**: 대시보드와 일관성 + 각 섹션의 중요도 시각화

### 3. 알림 토글 UX
- **고민**: 토글 시 즉시 저장 vs 하단 "저장" 버튼
- **결정**: 즉시 저장 (Auto-save)
  - 모던 웹 앱 트렌드
  - 사용자가 저장 버튼 찾을 필요 없음
  - Framer Motion으로 부드러운 피드백

### 4. 결제 내역 없을 때 Empty State
- 첫 사용자는 결제 내역이 없으므로 빈 화면 방지
- 아이콘 + 안내 문구로 "아직 결제 내역이 없습니다" 표시

---

## 결정된 내용

### ✅ NextAuth Sessions 테이블 분리는 Phase 2로 연기
- **이유**: 현재 동작에 문제 없음 (Supabase Auth 테이블 사용)
- **문서화**: `docs/issues/nextauth-supabase-sessions-conflict.md`
- **beads 이슈**: `cuggu-9xi` (P2, Bug)
- **Phase 2 작업**: `nextauth_sessions` 테이블 생성 + NextAuth adapter 설정 변경

### ✅ 설정 API는 RESTful 패턴 유지
- `GET /api/user/profile` - 조회
- `PATCH /api/user/settings` - 부분 업데이트
- `GET /api/payments/history` - 결제 내역

### ✅ 프리미엄 업그레이드 버튼은 UI만 (결제 연동 Phase 3)
- Toss Payments 연동 전까지는 버튼만 배치
- 클릭 시 "준비 중" 또는 결제 페이지로 이동 (추후 구현)

### ✅ 비밀번호 변경/계정 삭제는 모달 없이 별도 페이지로
- 현재는 UI만 구현 (클릭 시 아무 동작 없음)
- Phase 2에서 `/dashboard/settings/password`, `/dashboard/settings/delete-account` 라우트 추가

---

## 난이도 및 발견

### 난이도: 중 (3/5)
- API 3개 구현은 간단했음
- NextAuth v5 마이그레이션이 예상치 못한 시간 소요
- Sessions 테이블 충돌 디버깅에 시간 투자

### 발견한 것들

#### 1. NextAuth v5 Breaking Changes
- `getServerSession(authOptions)` → `auth()`
- `authOptions` 객체가 `authConfig`로 변경
- Drizzle Adapter 사용 시 `sessionsTable` 필드가 충돌 가능

#### 2. Supabase Auth 테이블 구조
- Supabase는 자체 Auth 시스템을 위해 `sessions` 테이블 생성
- NextAuth와 병행 사용 시 테이블 이름 충돌
- **교훈**: 외부 서비스 (Supabase)와 라이브러리 (NextAuth) 통합 시 기본 테이블 이름 확인 필수

#### 3. Drizzle Migration 주의사항
- `drizzle-kit push`는 스키마 불일치 시 강제 적용 (위험)
- 프로덕션에서는 `drizzle-kit generate` → SQL 검토 → Supabase SQL Editor 실행
- Constraint 오류 시 `IF NOT EXISTS` / `IF EXISTS` 사용

#### 4. Framer Motion + Tailwind 조합
- 토글 스위치 애니메이션: `motion.div` + `animate={{ x: ... }}`
- 프로그레스 바: `initial={{ width: 0 }}` + `animate={{ width: "50%" }}`
- ScrollFade 재사용으로 일관된 페이지 전환 효과

---

## 남은 것/미정

### 미완성 기능
- [ ] 프리미엄 업그레이드 플로우 (Toss Payments 연동)
- [ ] AI 크레딧 구매 플로우
- [ ] 비밀번호 변경 기능
- [ ] 계정 삭제 플로우 (확인 다이얼로그 + API)
- [ ] 결제 영수증 다운로드
- [ ] 카카오톡 알림 (카카오 알림톡 API)

### 테스트 필요
- [ ] 로그인 후 `/dashboard/settings` 접근
- [ ] 프로필 정보 정상 표시 확인
- [ ] 이메일 알림 토글 동작 확인 (DB 업데이트 검증)
- [ ] AI 크레딧 표시 확인
- [ ] 결제 내역 없을 때 Empty State 확인

### 기술 부채
- [ ] NextAuth Sessions 테이블 분리 (`cuggu-9xi`)
- [ ] API 에러 핸들링 개선 (Toast 알림으로 변경)
- [ ] 설정 페이지 스켈레톤 UI (로딩 상태 개선)

---

## 다음 액션

### 1. 즉시 (오늘)
- [x] 설정 페이지 기능 테스트
- [ ] 개발 서버 `.next` 캐시 삭제 후 재시작
- [ ] 로그인 후 설정 페이지 접근 확인
- [ ] 브랜치 커밋 + PR 생성

### 2. 단기 (이번 주)
- [ ] 프리미엄 플랜 UI 개선 (업그레이드 버튼 활성화)
- [ ] 비밀번호 변경 페이지 구현
- [ ] 계정 삭제 플로우 구현

### 3. 중기 (다음 주)
- [ ] Toss Payments 연동 (Phase 4)
- [ ] NextAuth Sessions 테이블 분리 (`cuggu-9xi`)

---

## 서랍메모 (개발 팁)

### NextAuth v5 세션 가져오기
```typescript
// ❌ 구버전 (v4)
import { getServerSession } from "next-auth";
const session = await getServerSession(authOptions);

// ✅ 신버전 (v5)
import { auth } from "@/auth";
const session = await auth();
```

### Drizzle Migration 안전하게 실행
```bash
# 1. 마이그레이션 SQL 생성
npx drizzle-kit generate

# 2. SQL 파일 확인 (db/migrations/*.sql)
cat db/migrations/0002_*.sql

# 3. Supabase SQL Editor에서 직접 실행 (프로덕션)
# 또는 개발 환경에서만 push
npx drizzle-kit push  # 주의: 강제 적용
```

### Framer Motion 토글 스위치
```tsx
<motion.div
  className="w-5 h-5 bg-white rounded-full"
  animate={{ x: isOn ? 24 : 0 }}
  transition={{ type: "spring", stiffness: 500, damping: 30 }}
/>
```

---

## 내 질문 평가 및 피드백

### 좋았던 점
- "대시보드에 설정 메뉴 추가하자" → 명확한 요구사항
- "편집하기 새 탭으로 열기" → 구체적인 UX 개선 요청
- "일단 커밋부터 하자" → 작업 단위 분리 의식

### 개선할 점
- 설정 페이지 구현 전 **어떤 섹션이 필요한지** 먼저 정의했다면 더 효율적
- NextAuth v5 마이그레이션은 프로젝트 초기에 한 번에 처리했어야 함
- Sessions 테이블 충돌 이슈를 미리 예측 못함 (Supabase Auth 테이블 구조 확인 필요)

### 다음 작업 시 참고
- 외부 서비스 (Supabase, Vercel) 통합 시 **기본 테이블/설정 먼저 확인**
- MVP 우선순위 명확히 → 설정 페이지는 필수지만 모든 기능 구현 불필요
- 단계별 테스트 (UI → API → DB) 습관화

---

## 관련 문서
- `docs/issues/nextauth-supabase-sessions-conflict.md` - Sessions 테이블 충돌 상세 분석
- `docs/roadmap.md` - MVP Phase 4 (결제 시스템)
- `CLAUDE.md` - 프로젝트 컨벤션 및 작업 규칙

## 관련 이슈
- `cuggu-9xi` - NextAuth sessions 테이블 분리 (P2, Bug)

---

**다음 일지**: Toss Payments 연동 또는 청첩장 템플릿 확장
