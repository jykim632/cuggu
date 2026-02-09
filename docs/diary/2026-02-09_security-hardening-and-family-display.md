# 2026-02-09 보안 강화 + 가족 표기 개선

## 작업한 내용

### 1. 보안 강화 (cuggu-8bw)
4개 영역 일괄 구현:

- **보안 헤더** (`next.config.ts`): HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-DNS-Prefetch-Control
- **Rate Limiting**: 범용 rate limiter (`lib/rate-limit.ts`) 신규 생성 → 기존 AI rate limiter 리팩터, proxy.ts에서 공개 API 엔드포인트 IP 기반 30req/min, verify 5회/15분, rsvp 10회/시간 (IP+invitationId 조합)
- **개인정보 암호화** (AES-256-GCM): `lib/crypto.ts` 신규, RSVP phone/email 암호화 저장+복호화 마스킹, 청첩장 계좌번호(본인+부모님) 암호화/복호화, 기존 데이터 마이그레이션 스크립트
- **자동 삭제 스케줄러**: Vercel Cron 매일 03:00 UTC, EXPIRED+30일 → soft delete, DELETED+30일 → hard delete(DB+S3), CRON_SECRET 인증

### 2. 가족 표기 개선 (cuggu-rqq)
- **부모님 표기 안 함** (`self_only` 모드): FamilyDisplayModeSchema에 추가, 선택 시 부모님 이름/고인/관계 필드 전체 숨김
- **관계 직접 입력**: select에 "직접 입력" 옵션 추가, RelationField 컴포넌트로 분리, 프리셋에 없는 값 자동 감지

## 왜 했는지

- 보안 감사에서 취약점 4가지 발견 → 개인정보보호법 위반 우려(평문 저장), 공개 엔드포인트 무방비, 보안 헤더 부재, 데이터 보존 정책 없음
- 가족 표기는 P1 이슈였는데 확인해보니 핵심(양부모/한부모/고인)은 이미 구현돼 있었음. 부족한 부분만 추가

## 결정된 내용

- CSP는 카카오맵 SDK 등 외부 리소스 때문에 report-only 먼저 → 안정화 후 enforce (이번엔 미포함)
- 암호화 포맷: `iv:authTag:ciphertext` (base64), 평문 구분은 `:` 포함 여부로
- `isEncrypted()` 체크로 마이그레이션 전/후 데이터 모두 호환
- 가족 표기 Phase 2의 나머지(anonymous/grandparents)는 당장 필요성 낮아서 보류

## 난이도/발견

- 보안 강화는 파일 12개 수정이지만 패턴이 반복적이라 난이도 자체는 중간
- `proxy.ts` matcher에 API 경로 추가할 때 NextAuth `auth()` 래퍼와의 호환성 확인 필요했음 — async 콜백 지원 확인 후 적용
- 가족 표기는 코드 읽어보니 거의 다 돼 있어서 실질 작업량 적었음
- 관계 직접입력은 select → custom input 전환 시 값 동기화가 살짝 까다로움 (useEffect로 해결)

## 남은 것

- [ ] CSP report-only 설정 (외부 리소스 목록 정리 필요)
- [ ] `scripts/encrypt-existing-data.ts` 실행 (프로덕션 DB 백업 후)
- [ ] ENCRYPTION_KEY, CRON_SECRET 환경변수 Vercel에 설정
- [ ] cron 엔드포인트 배포 후 동작 확인
- [ ] 가족 표기 anonymous/grandparents 모드 (필요 시 추후)

## 다음 액션

- `bd ready`로 다음 작업 선택
- 배포 전 ENCRYPTION_KEY 생성 & Vercel env 등록

## 수정 파일 목록

### 보안 강화
| 파일 | 상태 |
|------|------|
| `next.config.ts` | 수정 |
| `lib/rate-limit.ts` | 신규 |
| `lib/ai/rate-limit.ts` | 리팩터 |
| `proxy.ts` | 수정 |
| `lib/crypto.ts` | 신규 |
| `app/api/invitations/[id]/verify/route.ts` | 수정 |
| `app/api/invitations/[id]/rsvp/route.ts` | 수정 |
| `lib/invitation-utils.ts` | 수정 |
| `scripts/encrypt-existing-data.ts` | 신규 |
| `app/api/cron/cleanup/route.ts` | 신규 |
| `vercel.json` | 신규 |
| `.env.example` | 수정 |

### 가족 표기
| 파일 | 상태 |
|------|------|
| `schemas/invitation.ts` | 수정 |
| `lib/utils/family-display.ts` | 수정 |
| `components/editor/tabs/BasicInfoTab.tsx` | 수정 |
