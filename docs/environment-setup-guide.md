# 환경 변수 설정 가이드

AI 사진 생성 기능을 위한 외부 서비스 키 발급 및 설정 방법

## 1. Replicate API (AI 사진 생성)

### 발급 방법
1. https://replicate.com 접속
2. 회원가입/로그인 (GitHub 계정 연동 가능)
3. 우측 상단 프로필 → "API tokens"
4. "Create token" 클릭 → 토큰 복사

### .env.local 설정
```env
REPLICATE_API_TOKEN="r8_..."
```

### 비용
- Flux 모델: $0.04/이미지
- 1회 생성 (4장): $0.16
- 무료 크레딧: 없음 (즉시 과금)
- 결제 수단: 신용카드 등록 필요

---

## 2. Azure Face API (얼굴 감지)

### 발급 방법
1. https://portal.azure.com 접속
2. 리소스 만들기 → "Face" 검색
3. 리소스 생성:
   - **리전**: Korea Central
   - **가격 책정 계층**: F0 (무료)
   - **리소스 그룹**: cuggu-resources (신규 생성)
4. 배포 완료 후:
   - "키 및 엔드포인트" 메뉴 클릭
   - KEY 1 복사
   - 엔드포인트 URL 복사

### .env.local 설정
```env
AZURE_FACE_API_KEY="abc123..."
AZURE_FACE_ENDPOINT="https://koreacentral.api.cognitive.microsoft.com"
```

### 비용
- F0 무료 티어: 월 30,000 트랜잭션
- MVP 충분 (테스트 포함 월 500회 예상)

---

## 3. AWS S3 (이미지 저장소)

### 발급 방법

#### 3.1 S3 버킷 생성
1. https://console.aws.amazon.com/s3 접속
2. "버킷 만들기" 클릭
3. 설정:
   - **버킷 이름**: cuggu-ai-photos (고유해야 함)
   - **리전**: ap-northeast-2 (서울)
   - **퍼블릭 액세스 차단**: 모두 해제 (공개 URL 필요)
   - **버킷 버전 관리**: 비활성화
4. 생성 완료

#### 3.2 버킷 정책 설정 (공개 읽기)
1. 생성한 버킷 클릭 → "권한" 탭
2. "버킷 정책" 편집 → 아래 JSON 붙여넣기:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::cuggu-ai-photos/*"
    }
  ]
}
```

**주의**: `cuggu-ai-photos`를 본인 버킷명으로 변경

#### 3.3 IAM 사용자 생성
1. https://console.aws.amazon.com/iam 접속
2. "사용자" → "사용자 추가"
3. 설정:
   - **사용자 이름**: cuggu-s3-uploader
   - **권한 옵션**: "직접 정책 연결"
   - **정책**: AmazonS3FullAccess 선택
4. 생성 완료 후:
   - "보안 자격 증명" 탭
   - "액세스 키 만들기" → "애플리케이션 외부에서 실행되는 코드"
   - **액세스 키 ID** 및 **비밀 액세스 키** 복사 (다시 못 봄!)

### .env.local 설정
```env
AWS_REGION="ap-northeast-2"
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="abc123..."
S3_BUCKET_NAME="cuggu-ai-photos"
```

### 비용
- 첫 5GB 저장: 무료 (첫 12개월)
- PUT 요청: $0.005/1000건
- GET 요청: $0.0004/1000건
- 예상 비용: 월 $1 미만 (테스트 포함)

---

## 4. Upstash Redis (Rate Limiting)

### 발급 방법
1. https://console.upstash.com 접속
2. 회원가입/로그인 (GitHub 계정 연동 가능)
3. "Create Database" 클릭
4. 설정:
   - **Name**: cuggu-rate-limit
   - **Type**: Regional
   - **Region**: ap-northeast-1 (Tokyo, 서울 없음)
   - **TLS**: 활성화
5. 생성 완료 후:
   - "REST API" 탭 클릭
   - **UPSTASH_REDIS_REST_URL** 복사
   - **UPSTASH_REDIS_REST_TOKEN** 복사

### .env.local 설정
```env
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
```

### 비용
- 무료 티어: 10,000 커맨드/일
- MVP 충분 (Rate limit 체크만 사용)

---

## 체크리스트

발급 완료 후 `.env.local`에 모든 키 입력:

- [ ] REPLICATE_API_TOKEN
- [ ] AZURE_FACE_API_KEY
- [ ] AZURE_FACE_ENDPOINT
- [ ] AWS_REGION
- [ ] AWS_ACCESS_KEY_ID
- [ ] AWS_SECRET_ACCESS_KEY
- [ ] S3_BUCKET_NAME
- [ ] UPSTASH_REDIS_REST_URL
- [ ] UPSTASH_REDIS_REST_TOKEN

---

## 검증 방법

환경 변수 설정 후 서버 재시작:

```bash
npm run dev
```

터미널에서 에러 없이 실행되면 성공.

만약 `env.ts` 검증 에러 발생 시:
- 누락된 변수명 확인
- 값이 빈 문자열("")인지 확인
- URL 형식 확인 (http:// 또는 https://)

---

## 예상 총 비용 (월)

| 서비스 | 비용 |
|--------|------|
| Replicate | 사용량 기반 (테스트 $3-5) |
| Azure Face | 무료 (F0) |
| AWS S3 | $1 미만 |
| Upstash Redis | 무료 |
| **총합** | **$4-6/월** (테스트 기간) |

실제 운영 시 AI 생성 횟수에 따라 Replicate 비용 증가.
