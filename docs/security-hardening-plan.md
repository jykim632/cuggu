# 보안 강화 구현 계획 (cuggu-8bw)

> **beads 이슈**: `cuggu-8bw` (status: open, P2)
> **브랜치**: `develop`에서 분기 필요

## Context

보안 감사 결과 주요 취약점 발견:
- 보안 헤더 없음 (HSTS, CSP, X-Frame-Options 등)
- Rate limiting이 AI 생성 엔드포인트에만 적용 (verify/rsvp 등 공개 엔드포인트 무방비)
- 개인정보(계좌번호/전화번호/이메일) 평문 저장 (개인정보보호법 위반 우려)
- 만료 청첩장 자동 삭제 없음

4가지 영역을 모두 구현한다.

---

## 1. 보안 헤더 (next.config.ts)

`next.config.ts`에 `headers()` 추가:

```
HSTS: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
X-DNS-Prefetch-Control: on
```

CSP는 카카오맵 SDK, 이미지 CDN 등 외부 리소스가 많아서 report-only로 먼저 설정하고, 안정화 후 enforce 전환.

**수정 파일**: `next.config.ts`

---

## 2. Rate Limiting (Upstash)

### 2-1. 범용 rate limiter 유틸
**신규**: `lib/rate-limit.ts`

기존 `lib/ai/rate-limit.ts`의 Lua 스크립트 패턴을 재사용하되, 범용화:
- `rateLimit(key: string, limit: number, windowSec: number): Promise<{ allowed: boolean; remaining: number }>`
- 기존 AI rate limiter를 이 범용 함수로 리팩터링
- IP 추출 헬퍼: `getClientIp(req: NextRequest): string`

### 2-2. proxy.ts 확장 (기존 파일 수정)
**수정**: `proxy.ts` (프로젝트 루트, 이미 존재)

현재 구조: `export default auth((req) => { ... })` + `config.matcher`로 페이지 라우트만 처리 중 (`api` 제외).

변경 방향:
- `config.matcher`에 API 경로 추가: `/api/invitations/:id/verify`, `/api/invitations/:id/rsvp` 등 공개 엔드포인트
- 해당 경로에 대해 IP 기반 rate limiting 적용 후 `NextResponse.next()` 반환
- 기존 auth 로직은 그대로 유지

**주의**: Next.js 16에서 `proxy` 함수명 export 권장이지만, NextAuth `auth()` 래퍼가 default export를 요구하므로 현재 패턴 유지. (기능적으로 동일)

### 2-3. verify 엔드포인트 강화
**수정**: `app/api/invitations/[id]/verify/route.ts`

엔드포인트 레벨 정밀 rate limit: IP+invitationId 조합으로 5회/15분. 초과 시 429 응답.

### 2-4. RSVP 엔드포인트 보호
**수정**: `app/api/invitations/[id]/rsvp/route.ts`

IP+invitationId 조합 10회/시간.

**수정 파일**: `lib/rate-limit.ts`(신규), `proxy.ts`(수정), `verify/route.ts`, `rsvp/route.ts`, `lib/ai/rate-limit.ts`(리팩터)

---

## 3. 개인정보 암호화 (AES-256-GCM)

### 3-1. 암호화 유틸
**신규**: `lib/crypto.ts`

- `encrypt(plaintext: string): string` → `iv:authTag:ciphertext` (base64)
- `decrypt(encrypted: string): string`
- 키: `ENCRYPTION_KEY` 환경변수 (256-bit hex)
- Node.js 내장 `crypto` 모듈 사용 (외부 의존성 없음)

### 3-2. 암호화 대상
- **RSVP**: `guestPhone`, `guestEmail` (DB에 이미 `encrypted` 코멘트가 있지만 실제 암호화 없었음)
- **계좌번호**: `extendedData.groom.account.accountNumber`, `bride.account.accountNumber`, 부모님 계좌

### 3-3. 저장/조회 레이어
**수정**: `app/api/invitations/[id]/rsvp/route.ts` - POST 시 phone/email 암호화 후 저장, GET 시 복호화 후 마스킹
**수정**: `lib/invitation-utils.ts` - `invitationToDbUpdate()`에서 계좌번호 암호화, `dbRowToInvitation()`에서 복호화

### 3-4. 기존 데이터 마이그레이션
기존 평문 데이터를 암호화하는 마이그레이션 스크립트 (별도 실행):
**신규**: `scripts/encrypt-existing-data.ts`

**주의**: 스키마 변경 불필요 (컬럼 타입 VARCHAR 유지, 암호화된 문자열은 더 길지만 500자 이내)

**수정 파일**: `lib/crypto.ts`(신규), `rsvp/route.ts`, `lib/invitation-utils.ts`, `scripts/encrypt-existing-data.ts`(신규), `.env.example`

---

## 4. 자동 삭제 스케줄러 (Vercel Cron)

### 4-1. Cron API 엔드포인트
**신규**: `app/api/cron/cleanup/route.ts`

매일 03:00 UTC 실행:
1. `EXPIRED` 상태이고 `expiresAt` + 30일 지난 청첩장 → soft delete (`DELETED` 상태)
2. `DELETED` 상태이고 30일 지난 청첩장 → hard delete (DB에서 삭제 + S3 이미지 삭제)
3. 삭제된 RSVP 데이터는 cascade로 자동 삭제

보안: `CRON_SECRET` 환경변수로 인증. `Authorization: Bearer <CRON_SECRET>` 헤더 검증.

### 4-2. Vercel Cron 설정
**신규**: `vercel.json`

```json
{
  "crons": [
    { "path": "/api/cron/cleanup", "schedule": "0 3 * * *" }
  ]
}
```

**수정 파일**: `app/api/cron/cleanup/route.ts`(신규), `vercel.json`(신규), `.env.example`

---

## 수정 파일 전체 목록

| # | 파일 | 상태 | 영역 |
|---|------|------|------|
| 1 | `next.config.ts` | 수정 | 보안 헤더 |
| 2 | `lib/rate-limit.ts` | 신규 | Rate limiting |
| 3 | `proxy.ts` | 수정 | Rate limiting (기존 auth proxy에 추가) |
| 4 | `lib/ai/rate-limit.ts` | 수정 | Rate limiting (리팩터) |
| 5 | `app/api/invitations/[id]/verify/route.ts` | 수정 | Rate limiting |
| 6 | `app/api/invitations/[id]/rsvp/route.ts` | 수정 | Rate limiting + 암호화 |
| 7 | `lib/crypto.ts` | 신규 | 개인정보 암호화 |
| 8 | `lib/invitation-utils.ts` | 수정 | 계좌번호 암호화 |
| 9 | `scripts/encrypt-existing-data.ts` | 신규 | 기존 데이터 마이그레이션 |
| 10 | `app/api/cron/cleanup/route.ts` | 신규 | 자동 삭제 |
| 11 | `vercel.json` | 신규 | Cron 설정 |
| 12 | `.env.example` | 수정 | ENCRYPTION_KEY, CRON_SECRET |

---

## 주요 참조 파일 (읽기 필요)

- `lib/ai/rate-limit.ts` - 기존 Lua 스크립트 rate limiter 패턴
- `lib/ai/env.ts` - Upstash Redis 환경변수 검증 패턴
- `proxy.ts` - 기존 auth proxy (NextAuth `auth()` 래퍼)
- `db/schema.ts` - rsvps 테이블 구조 (guestPhone, guestEmail 컬럼)
- `app/api/invitations/[id]/verify/route.ts` - 비밀번호 검증 (rate limit 없음)
- `app/api/invitations/[id]/rsvp/route.ts` - RSVP 제출 (공개, rate limit 없음)
- `lib/invitation-utils.ts` - DB ↔ Invitation 변환 (계좌번호 평문)
- `schemas/rsvp.ts` - maskPhoneNumber, maskEmail 유틸

---

## 검증
- `npx tsc --noEmit` 타입 에러 없는지 확인
- 보안 헤더: `curl -I` 로 응답 헤더 확인
- Rate limiting: 연속 요청으로 429 응답 확인
- 암호화: DB 직접 조회해서 평문이 아닌 암호화 문자열 저장 확인
- Cron: `/api/cron/cleanup`에 Bearer 토큰 없이 호출 시 401 확인
