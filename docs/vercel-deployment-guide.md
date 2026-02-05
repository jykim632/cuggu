# Vercel 배포 가이드

Cuggu 프로젝트를 Vercel에 배포하는 단계별 가이드.

---

## 사전 준비

아래 서비스 계정이 모두 준비되어 있어야 함:

| 서비스 | 용도 | 가입 |
|---|---|---|
| Vercel | 호스팅 | https://vercel.com |
| Supabase | PostgreSQL DB | https://supabase.com |
| 카카오 개발자 | 소셜 로그인 | https://developers.kakao.com |
| Replicate | AI 사진 생성 | https://replicate.com |
| Azure | 얼굴 감지 | https://portal.azure.com |
| AWS | S3 이미지 저장소 | https://aws.amazon.com |
| Upstash | Redis Rate Limiting | https://upstash.com |

---

## Step 1: 로컬 빌드 확인

배포 전에 반드시 로컬에서 빌드가 통과하는지 확인한다.

```bash
npm run build
```

- 에러 없이 `✓ Compiled successfully` 나오면 OK
- 타입 에러나 import 에러가 있으면 여기서 먼저 해결

---

## Step 2: GitHub 리포지토리 Push

Vercel은 GitHub 연동 방식이 가장 편하다.

```bash
# 리모트 아직 없으면 추가
git remote add origin https://github.com/<username>/cuggu.git

# push
git push -u origin main
```

> `.env.local`은 `.gitignore`에 포함되어 있어야 한다. 절대 push 하지 말 것.

---

## Step 3: Vercel 프로젝트 생성

### 방법 A: 웹 대시보드 (추천)

1. https://vercel.com 로그인
2. **"Add New Project"** 클릭
3. GitHub 리포 선택 → **Import**
4. 설정 확인:
   - **Framework Preset**: `Next.js` (자동 감지됨)
   - **Build Command**: `next build` (기본값)
   - **Output Directory**: `.next` (기본값)
   - **Install Command**: `npm install` (기본값)
5. 환경변수는 **아직 입력하지 말고** 일단 넘어가도 됨 (Step 4에서 설정)
6. **Deploy** 클릭

> 첫 배포는 환경변수 없어서 실패할 수 있음. 정상임.

### 방법 B: CLI

```bash
npm i -g vercel
vercel login
vercel
```

대화형으로 프로젝트 연결 진행.

---

## Step 4: 환경변수 설정

Vercel 대시보드 → **Settings** → **Environment Variables**

아래 변수를 **모두** 입력한다:

### Database

| Key | Value | 비고 |
|---|---|---|
| `DATABASE_URL` | `postgresql://...` | Supabase → Settings → Database → Connection String (URI) |

### NextAuth 인증

| Key | Value | 비고 |
|---|---|---|
| `NEXTAUTH_URL` | `https://your-domain.vercel.app` | 배포 도메인 (커스텀 도메인 있으면 그걸로) |
| `NEXTAUTH_SECRET` | `(랜덤 문자열)` | 아래 명령으로 생성 |

```bash
# NEXTAUTH_SECRET 생성
openssl rand -base64 32
```

### 카카오 OAuth

| Key | Value | 비고 |
|---|---|---|
| `KAKAO_CLIENT_ID` | `(REST API 키)` | 카카오 개발자 콘솔 → 앱 → 앱 키 |
| `KAKAO_CLIENT_SECRET` | `(Client Secret)` | 카카오 개발자 콘솔 → 보안 |

### AI 서비스

| Key | Value | 비고 |
|---|---|---|
| `REPLICATE_API_TOKEN` | `r8_...` | https://replicate.com/account/api-tokens |
| `AZURE_FACE_API_KEY` | `(키)` | Azure Portal → Face API → Keys |
| `AZURE_FACE_ENDPOINT` | `https://....cognitiveservices.azure.com` | Azure Portal → Face API → Endpoint |

### AWS S3

| Key | Value | 비고 |
|---|---|---|
| `AWS_REGION` | `ap-northeast-2` | 서울 리전 |
| `AWS_ACCESS_KEY_ID` | `AKIA...` | IAM 사용자 Access Key |
| `AWS_SECRET_ACCESS_KEY` | `(시크릿)` | IAM 사용자 Secret Key |
| `S3_BUCKET_NAME` | `cuggu-images` | S3 버킷 이름 |
| `CLOUDFRONT_DOMAIN` | `d1234.cloudfront.net` | 선택사항. 없으면 S3 직접 URL 사용 |

### Redis (Rate Limiting)

| Key | Value | 비고 |
|---|---|---|
| `UPSTASH_REDIS_REST_URL` | `https://....upstash.io` | Upstash 콘솔 → REST API URL |
| `UPSTASH_REDIS_REST_TOKEN` | `(토큰)` | Upstash 콘솔 → REST API Token |

### 결제 (아직 미구현이면 생략 가능)

| Key | Value | 비고 |
|---|---|---|
| `TOSS_CLIENT_KEY` | `(클라이언트 키)` | Toss Payments 개발자센터 |
| `TOSS_SECRET_KEY` | `(시크릿 키)` | Toss Payments 개발자센터 |

> 환경변수 입력 후 **반드시 Redeploy** 해야 적용된다.
> Vercel 대시보드 → Deployments → 최신 배포 → `...` → **Redeploy**

---

## Step 5: DB 마이그레이션

Supabase DB에 테이블이 아직 없으면 로컬에서 push:

```bash
npx drizzle-kit push
```

이미 `db:push` 한 적 있으면 건너뛰기.

---

## Step 6: 외부 서비스 설정 업데이트

### 6-1. 카카오 로그인 Redirect URI

카카오 개발자 콘솔 → 앱 → **카카오 로그인** → **Redirect URI** 추가:

```
https://your-domain.vercel.app/api/auth/callback/kakao
```

> `localhost:3000` URI는 개발용으로 유지하고, Vercel 도메인을 **추가**한다.

### 6-2. S3 CORS 설정

S3 버킷 → **권한** → **CORS 설정**:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://your-domain.vercel.app"
    ],
    "ExposeHeaders": ["ETag"]
  }
]
```

### 6-3. Supabase 연결 허용

Supabase → Settings → Database → **Connection Pooling** 활성화 권장 (Serverless 환경에서 커넥션 풀 관리).

> Vercel Serverless Functions는 요청마다 새 커넥션을 열 수 있어서, Connection Pooler (Transaction mode) 사용 시 `?pgbouncer=true` 파라미터를 DATABASE_URL에 추가한다.

```
postgresql://user:pass@host:6543/db?pgbouncer=true
```

---

## Step 7: 배포 확인 체크리스트

배포 완료 후 아래 항목을 순서대로 확인:

```
[ ] 1. 사이트 접속 — 랜딩 페이지 정상 로딩
[ ] 2. 카카오 로그인 — 로그인 → 세션 유지 확인
[ ] 3. 대시보드 접속 — /dashboard 정상 렌더링
[ ] 4. 청첩장 생성 — 새 청첩장 생성 후 편집기 진입
[ ] 5. 이미지 업로드 — 갤러리 탭에서 이미지 업로드 (S3 연동 확인)
[ ] 6. AI 사진 생성 — 증명 사진 업로드 → 생성 (Replicate 연동 확인)
[ ] 7. 미리보기/발행 — 청첩장 미리보기 및 발행 테스트
```

---

## 트러블슈팅

### 빌드 실패: `Module not found`

→ `package.json`의 dependencies 확인. `npm install` 후 다시 push.

### 500 에러: Database connection

→ `DATABASE_URL`이 올바른지 확인. Supabase가 Pause 상태인지 체크. Connection Pooler URL 사용 권장.

### 카카오 로그인 실패: redirect_uri_mismatch

→ 카카오 개발자 콘솔의 Redirect URI가 Vercel 배포 도메인과 정확히 일치하는지 확인.

### 이미지 업로드 실패: CORS 에러

→ S3 CORS에 Vercel 도메인 추가했는지 확인.

### sharp 관련 에러

→ Vercel Node.js 런타임에서 sharp는 기본 지원됨. 에러 나면 `package-lock.json` 삭제 후 `npm install` → 다시 push.

### 환경변수 적용 안 됨

→ 환경변수 추가/수정 후 **Redeploy** 필수. 자동 적용 안 됨.

---

## 커스텀 도메인 연결 (선택)

1. Vercel 대시보드 → Settings → **Domains**
2. 도메인 입력 (예: `cuggu.kr`)
3. DNS 설정:

| Type | Name | Value |
|---|---|---|
| CNAME | `@` 또는 `www` | `cname.vercel-dns.com` |

또는 A 레코드:

| Type | Name | Value |
|---|---|---|
| A | `@` | `76.76.21.21` |

4. SSL 인증서 자동 발급 (수 분 소요)
5. 환경변수 `NEXTAUTH_URL`을 커스텀 도메인으로 변경 → Redeploy

---

## 자동 배포

GitHub 연동 시 `main` 브랜치에 push하면 **자동 배포**됨.

- `main` push → Production 배포
- PR 생성 → Preview 배포 (PR별 고유 URL)

Preview 배포의 환경변수는 Vercel에서 "Preview" 환경 선택해서 별도로 설정 가능.
