# 신규 회원가입 차단 (Registration Gate)

> 날짜: 2026-02-09
> 브랜치: `feat/ai-theme-generation`
> 커밋: `ce615fd`

---

## 왜 했는지

OAuth 로그인(카카오/네이버)으로 아무나 가입해서 AI 크레딧(기본 2회)을 소진할 수 있는 상태. 아직 운영 전이라 초대 기반으로 운영하고 싶은데 별도 초대 시스템 만들 필요까지는 없고, 단순히 "신규 가입 on/off"만 있으면 됐음.

---

## 작업 내용

### 핵심 로직: `signIn` 콜백

NextAuth의 `signIn` 콜백에서 OAuth 로그인 시:
1. `accounts` 테이블에 해당 provider+providerAccountId가 있는지 확인
2. 있으면 → 기존 유저 → 무조건 통과
3. 없으면 → 신규 유저 → `appSettings`의 `registration_enabled` 확인
4. `false`(또는 키 없음) → `/login?error=RegistrationClosed`로 리다이렉트

### 변경 파일 (7개)

| 파일 | 변경 | 내용 |
|------|------|------|
| `lib/settings.ts` | 신규 | `getAppSetting()`, `setAppSetting()`, `isRegistrationEnabled()` 헬퍼 |
| `auth.ts` | 수정 | `signIn` 콜백 추가 |
| `app/(auth)/login/page.tsx` | 수정 | `?error=RegistrationClosed` 시 빨간 배너 |
| `app/api/admin/settings/route.ts` | 신규 | GET/PATCH 어드민 설정 API |
| `app/admin/settings/page.tsx` | 신규 | 토글 스위치 UI |
| `components/admin/AdminNav.tsx` | 수정 | "설정" 메뉴 추가 |
| `docs/diary/2026-02-09_registration-gate.md` | 신규 | 이 문서 |

### 부수 효과

- `appSettings` 테이블 최초 활용. 스키마에만 있고 코드에서 안 쓰이고 있었는데 이번에 처음 연결됨.
- 범용 `getAppSetting`/`setAppSetting` 헬퍼가 생겨서 향후 다른 설정(점검 모드, 기능 플래그 등)도 같은 패턴으로 추가 가능.

---

## 결정 사항

| 결정 | 이유 |
|------|------|
| `appSettings` 테이블 활용 (env var X) | 어드민 UI에서 런타임 토글 가능. 재배포 불필요 |
| 기본값 `false` (차단) | 안전한 기본값. 배포 즉시 차단 상태 |
| DB 마이그레이션 없음 | `appSettings` 테이블 이미 존재. 키 없으면 기본값 fallback |
| 로그인 페이지에 에러 표시 (별도 에러 페이지 X) | `pages.error = "/error"` 설정은 있지만 실제 페이지가 없어서, 로그인 페이지 자체에 표시하는 게 더 자연스러움 |

---

## 고민 / 발견

- **NextAuth signIn 콜백 실행 순서**: signIn 콜백은 DrizzleAdapter가 유저를 생성하기 *전*에 실행됨. 그래서 `accounts` 테이블 조회로 신규/기존 구분이 가능. 만약 adapter가 먼저 실행됐으면 이 방식이 안 됐을 것.
- **`/error` 페이지 없음**: auth config에 `pages.error = "/error"` 설정되어 있는데 실제 페이지가 없어서, signIn에서 `false` 리턴 대신 직접 redirect URL 문자열 리턴하는 방식으로 처리. NextAuth에서 signIn 콜백이 문자열 반환하면 해당 URL로 리다이렉트함.
- **난이도**: 낮음. `appSettings` 테이블이 이미 있어서 인프라 작업이 없었고, NextAuth signIn 콜백 한 곳만 추가하면 됐음.

---

## 남은 것 / 미정

- [ ] `/error` 페이지 생성 — NextAuth 기본 에러(OAuthCallbackError 등) 대응용
- [ ] 초대 코드 시스템 — 지금은 단순 on/off지만, 나중에 "초대 코드가 있는 사람만 가입 가능" 같은 세밀한 제어가 필요할 수 있음
- [ ] 설정 캐싱 — 매 로그인마다 DB 조회함. 트래픽 많아지면 Redis 캐싱 고려 (현재는 불필요)

---

## 다음 액션

별도 없음. 기능 완결.
