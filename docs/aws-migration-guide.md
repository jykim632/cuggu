# Cuggu AWS 마이그레이션 가이드

> 최종 업데이트: 2026-02-09

---

## 1. 현재 인프라 구성

```
Vercel (호스팅/컴퓨팅)
├── Next.js 16 Serverless Functions
├── Vercel Cron (매일 3AM 만료 청첩장 정리)
│
├── Supabase PostgreSQL (DB, prepare: false)
├── Upstash Redis REST (레이트 리밋)
├── AWS S3 + CloudFront (이미지 저장/CDN) ← 이미 AWS
│
└── 외부 API
    ├── Replicate (Flux Pro/Dev, PhotoMaker)
    ├── OpenAI (GPT Image, DALL-E 3)
    ├── Anthropic (테마 생성)
    ├── Azure Face API (얼굴 감지)
    └── Kakao Map API
```

### 마이그레이션 대상

| 서비스 | 현재 | 마이그레이션 필요 |
|---|---|---|
| 컴퓨팅 | Vercel Functions | **필요** |
| DB | Supabase PostgreSQL | **필요** |
| 캐시 | Upstash Redis | 선택 (REST API라 어디서든 동작) |
| 이미지 저장 | AWS S3 | 유지 |
| CDN | CloudFront | 유지 |
| AI/외부 API | Replicate, OpenAI 등 | 변경 없음 |

---

## 2. 마이그레이션 옵션 비교

### 옵션 A: AWS Amplify (가장 쉬움)

| 항목 | 현재 | 마이그레이션 |
|---|---|---|
| 컴퓨팅 | Vercel | Amplify Hosting (Next.js SSR 네이티브 지원) |
| DB | Supabase | RDS PostgreSQL |
| 캐시 | Upstash | ElastiCache Redis 또는 Upstash 유지 |
| Cron | Vercel Cron | EventBridge + Lambda |
| CI/CD | Vercel 자동 | Amplify 자동 (Git 연동) |

**장점**:
- Vercel과 가장 비슷한 경험 (git push → 자동 배포)
- Next.js SSR/SSG/ISR 전부 지원
- 코드 변경 최소
- SSL/도메인 자동 관리

**단점**:
- Amplify의 Next.js 지원이 Vercel보다 뒤처질 수 있음
- Next.js 16 호환성 확인 필요
- 커스터마이징 제한적

---

### 옵션 B: ECS Fargate (컨테이너)

| 항목 | 현재 | 마이그레이션 |
|---|---|---|
| 컴퓨팅 | Vercel | ECS Fargate (Docker 컨테이너) |
| DB | Supabase | RDS PostgreSQL |
| 캐시 | Upstash | ElastiCache Redis |
| LB | - | ALB (Application Load Balancer) |
| Cron | Vercel Cron | ECS Scheduled Task 또는 EventBridge |
| CI/CD | Vercel 자동 | GitHub Actions + ECR |

**ECS Fargate란?**
```
ECS = Elastic Container Service (컨테이너 오케스트레이션)
Fargate = 서버리스 컴퓨팅 엔진 (서버 관리 X)

ECS Fargate = "서버 없이 Docker 컨테이너만 올리면 AWS가 알아서 실행"
```

**EC2와 비교**:
```
EC2 (전통):
  너 → 서버 구매 → OS 설치 → Node.js 설치 → 앱 배포 → 서버 관리/패치/모니터링

ECS Fargate:
  너 → Dockerfile 작성 → "이 컨테이너 실행해줘" → 끝
  서버? AWS가 알아서 할당하고 관리
```

**동작 흐름**:
```
1. Dockerfile 작성 (Next.js standalone 빌드)
2. Docker 이미지 → ECR (AWS 컨테이너 레지스트리)에 push
3. ECS 서비스 생성 (vCPU 0.5개, RAM 1GB 등)
4. ALB (로드밸런서)가 앞단에서 트래픽 분배
5. 오토스케일링 설정 (CPU 70% 넘으면 컨테이너 추가)
```

**필요한 코드 변경**:
- `next.config.ts`에 `output: 'standalone'` 추가
- Dockerfile 작성
- Health check endpoint 추가

**직접 설정해야 하는 것들**:
- Dockerfile, ECR (이미지 저장소)
- ECS Task Definition (CPU/메모리/환경변수)
- ECS Service (컨테이너 개수, 헬스체크)
- ALB + Target Group (로드밸런서)
- VPC + Subnets + Security Groups (네트워크)
- Route 53 (도메인) + ACM (SSL)
- CloudWatch (로그/모니터링)
- GitHub Actions (CI/CD 파이프라인)

**장점**:
- 트래픽에 따라 오토스케일링 가능
- 월 비용 예측 가능 (시간 단위 과금)
- cold start 없음 (항상 실행)
- 가장 유연한 제어권

**단점**:
- 설정할 게 많음 (VPC, ALB, ECS, ECR 등)
- 트래픽 없어도 최소 비용 발생 ($30~60/월)
- Docker, ECS, ALB 이해 필요

---

### 옵션 C: SST + Lambda (풀 서버리스) — 추천

| 항목 | 현재 | 마이그레이션 |
|---|---|---|
| 컴퓨팅 | Vercel | Lambda + CloudFront (OpenNext 변환) |
| DB | Supabase | RDS PostgreSQL + RDS Proxy (커넥션 풀링) |
| 캐시 | Upstash | Upstash 유지 (REST API라 Lambda 호환) |
| Cron | Vercel Cron | EventBridge |
| CI/CD | Vercel 자동 | SST CLI |
| IaC | 없음 | SST (CDK 기반) |

#### SST란?

```
SST = Serverless Stack (프레임워크)
"AWS 인프라를 코드 한 줄로 만들어주는 도구"
```

원래 Lambda + CloudFront + S3 등을 직접 연결하려면 CloudFormation/CDK로 수백 줄 작성해야 하지만, SST가 추상화해줌.

```typescript
// sst.config.ts — 이것만 쓰면 전체 인프라가 생성됨
export default $config({
  app(input) {
    return { name: "cuggu", region: "ap-northeast-2" };
  },
  async run() {
    // Next.js 앱 배포 → Lambda + CloudFront 자동 생성
    new sst.aws.Nextjs("CugguWeb", {
      domain: "cuggu.com",
      environment: {
        DATABASE_URL: "...",
        S3_BUCKET_NAME: "...",
      },
    });

    // Cron 작업 → EventBridge + Lambda 자동 생성
    new sst.aws.Cron("Cleanup", {
      schedule: "rate(1 day)",
      function: "packages/functions/src/cleanup.handler",
    });
  },
});
```

배포:
```bash
npx sst deploy --stage production
# → CloudFormation 스택 생성
# → Lambda 함수 배포
# → CloudFront 배포
# → Route 53 도메인 연결
# → 전부 자동
```

#### OpenNext란?

Next.js는 Vercel이 만든 프레임워크라서, Vercel에서 돌리는 게 가장 잘 동작하도록 설계되어 있음. AWS Lambda에 올리면 Vercel 전용 어댑터가 빠지기 때문에 그대로는 안 돌아감.

```
OpenNext = "Next.js를 Vercel 없이 AWS에서 돌릴 수 있게 변환해주는 어댑터"
```

**변환 과정**:
```
Next.js 앱 코드
    ↓
next build (일반 빌드)
    ↓
.next/ 폴더 생성
    ↓
OpenNext가 .next/ 를 분석해서 AWS용으로 재패키징
    ↓
  ┌──────────────────────────────────┐
  │  output/                         │
  │  ├── server-function/       → Lambda (SSR + API)
  │  ├── middleware/            → CloudFront Function
  │  ├── image-optimization/    → Lambda (이미지 리사이징)
  │  ├── assets/                → S3 (정적 파일)
  │  └── cache/                 → S3 or DynamoDB (ISR 캐시)
  └──────────────────────────────────┘
```

**Next.js 기능별 변환 매핑**:

| Next.js 기능 | Vercel에서 | OpenNext → AWS에서 |
|---|---|---|
| SSR | Vercel Function | Lambda |
| API Routes | Vercel Function | Lambda |
| 정적 파일 | Vercel CDN | S3 + CloudFront |
| Middleware | Vercel Edge | CloudFront Function |
| ISR 캐시 | Vercel KV | S3 or DynamoDB |
| Image Optimization | Vercel Image | 별도 Lambda |
| Streaming/RSC | Vercel Streaming | Lambda Response Streaming |
| Server Actions | Vercel Function | Lambda |

**SST와 OpenNext의 관계**:
```
SST가 내부적으로 OpenNext를 사용함

개발자가 할 일:
  sst.config.ts에 "new sst.aws.Nextjs(...)" 한 줄

SST가 하는 일:
  1. next build 실행
  2. OpenNext로 .next/ → AWS 패키지 변환
  3. Lambda 함수 생성
  4. S3 버킷 생성 + 정적 파일 업로드
  5. CloudFront 배포 생성
  6. 도메인 연결
  7. 전부 CloudFormation으로 관리

→ 개발자는 OpenNext를 직접 만질 필요 없음
```

#### Lambda 기반 Next.js 동작 구조

```
Vercel:
  브라우저 → Vercel Edge → Vercel Serverless Function (Next.js)

SST/Lambda:
  브라우저
    ↓
  CloudFront (CDN)
    ↓
    ├── 정적 파일 (_next/static/*) → S3에서 직접 서빙
    │   JS, CSS, 이미지 등 → 빠름, Lambda 안 탐
    │
    ├── API Routes (/api/*) → Lambda 함수 호출
    │   /api/ai/generate, /api/invitations 등
    │
    ├── SSR 페이지 → Lambda 함수 호출
    │   /editor/[id] → Lambda가 HTML 렌더링 후 반환
    │
    └── ISR/캐시된 페이지 → S3 캐시 or Lambda 재생성
```

#### Cold Start 이슈 (Lambda의 약점)

```
Lambda 동작:
  요청 없음: 컨테이너 없음 (비용 $0)
  요청 옴:   컨테이너 생성 (1~3초) → 처리 → 응답
  또 요청:   기존 컨테이너 재사용 (빠름)
  10분 방치: 컨테이너 제거 → 다시 cold start

Cold Start 시간:
  Node.js Lambda: 약 500ms ~ 2초
  Next.js SSR: 약 1~3초 (번들 크기에 따라)
```

**완화 방법**:

| 방법 | 설명 | 비용 |
|---|---|---|
| Provisioned Concurrency | 항상 N개 Lambda를 warm 유지 | 월 $10~20 추가 |
| CloudFront 캐싱 | SSR 결과를 CDN에 캐시 (공개 청첩장 /inv/[id]) | 추가 비용 거의 없음 |
| 트래픽 패턴 활용 | 청첩장 공유 시 순간 트래픽 → warm 상태 유지 | 무료 |

**이 프로젝트 특성상**:
- 공개 청첩장 (`/inv/[id]`): CloudFront 캐시 가능 → cold start 영향 없음
- 에디터 (`/editor/[id]`): 로그인 유저만 사용 → 약간의 지연 허용 가능
- AI 생성 API: Replicate 호출 자체가 10~30초 → cold start 1~2초는 무시 가능

---

### 옵션 D: EC2 (전통 서버) — 비추천

- 가장 많은 제어권, 가장 많은 운영 부담
- 1인 운영에는 과도함

---

## 3. 상세 비교표

### 운영 부담

| 항목 | Amplify | ECS Fargate | SST/Lambda |
|---|---|---|---|
| 배포 | git push → 자동 | Dockerfile → ECR → ECS 업데이트 | `npx sst deploy` |
| 스케일링 | 자동 (관리형) | Auto Scaling 직접 설정 | 자동 (Lambda 특성) |
| 모니터링 | CloudWatch 기본 | CloudWatch + 헬스체크 설정 | CloudWatch + SST Console |
| SSL | 자동 (ACM) | ALB + ACM 직접 설정 | CloudFront + ACM 자동 |
| 장애 대응 | AWS 관리 | 컨테이너 재시작 정책 설정 | Lambda 자동 재시도 |
| 코드 변경 | 환경변수만 교체 | standalone + Dockerfile + healthcheck | sst.config.ts 작성 |
| 학습 비용 | 낮음 | 중간 (Docker, ECS, ALB) | 중간 (SST, Lambda 특성) |

### 확장성

| 시나리오 | Amplify | ECS Fargate | SST/Lambda |
|---|---|---|---|
| 평소 (소량 트래픽) | 자동 축소, 비용 낮음 | 최소 1 태스크 항상 실행 | 0으로 축소, 비용 최소 |
| 청첩장 바이럴 (순간 트래픽) | 자동 대응 | 오토스케일링 설정 따라 | 즉시 확장 (동시 실행) |
| AI 생성 (CPU 집약) | 외부 API 호출이라 무관 | 무관 | 무관 |
| 이미지 서빙 | CloudFront 처리 | CloudFront 처리 | CloudFront 처리 |

### 비용 (월 기준 추정)

| 항목 | 현재 (추정) | Amplify | ECS Fargate | SST/Lambda |
|---|---|---|---|---|
| 컴퓨팅 | Vercel Free~$20 | $5~15 | $30~60 | $5~20 |
| DB | Supabase Free~$25 | RDS $15~30 | RDS $15~30 | RDS $15~30 |
| 캐시 | Upstash Free | ElastiCache $15+ 또는 Upstash 유지 | ElastiCache $15+ | Upstash 유지 $0 |
| S3+CF | 동일 | 동일 | 동일 | 동일 |
| **합계** | **$0~45** | **$20~45** | **$60~105** | **$20~50** |

### 마이그레이션 작업량

| 작업 | Amplify | ECS Fargate | SST/Lambda |
|---|---|---|---|
| 코드 변경 | 환경변수만 | Dockerfile + standalone + healthcheck | sst.config.ts + RDS Proxy |
| 인프라 설정 | Amplify 콘솔 | VPC/ALB/ECS/ECR 전부 | `sst deploy` 한 줄 |
| DB 마이그레이션 | pg_dump → RDS | 동일 | 동일 |
| 도메인/SSL | Route 53 + Amplify | Route 53 + ALB + ACM | Route 53 + CloudFront + ACM |
| Cron 이전 | EventBridge + Lambda | ECS Scheduled Task | SST Cron 설정 |
| 예상 소요 시간 | **1~2일** | **3~5일** | **2~3일** |

---

## 4. SST/Lambda 적용 시 아키텍처

```
                    ┌──────────────┐
                    │   Route 53   │
                    │  cuggu.com   │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  CloudFront  │
                    │  (CDN/라우팅) │
                    └──┬───┬───┬──┘
                       │   │   │
          ┌────────────┘   │   └────────────┐
          │                │                │
  ┌───────▼──────┐ ┌──────▼───────┐ ┌──────▼──────┐
  │   S3 Bucket  │ │   Lambda     │ │   Lambda    │
  │  정적 파일    │ │  (SSR + API) │ │  (Image     │
  │  JS/CSS/IMG  │ │              │ │  Optimize)  │
  └──────────────┘ └──────┬───────┘ └─────────────┘
                          │
              ┌───────────┼───────────┐
              │           │           │
      ┌───────▼───┐ ┌────▼────┐ ┌───▼──────────┐
      │ RDS Proxy │ │ Upstash │ │ S3           │
      │     ↓     │ │ Redis   │ │ cuggu-images │
      │ RDS       │ │ (유지)  │ │ (이미 AWS)   │
      │ PostgreSQL│ │         │ │              │
      └───────────┘ └─────────┘ └──────────────┘

      ┌──────────────┐
      │ EventBridge  │ → Lambda (Cron: 만료 청첩장 정리)
      └──────────────┘
```

### 코드 변경사항

```
변경 필요:
  + sst.config.ts (신규 — 인프라 정의)
  + DATABASE_URL → RDS 연결 문자열로 변경

변경 불필요:
  - 앱 코드 전체 (그대로)
  - Drizzle ORM 스키마 (그대로)
  - S3/CloudFront 로직 (이미 AWS)
  - Upstash Redis (REST API라 어디서든 동작)
  - AI API 호출 (외부 API라 무관)

삭제:
  - vercel.json (더 이상 필요 없음)
```

---

## 5. DB 마이그레이션 (공통)

Supabase PostgreSQL → RDS PostgreSQL 이동 절차:

```bash
# 1. Supabase에서 데이터 export
pg_dump --no-owner --no-acl \
  -h db.xxx.supabase.co -U postgres -d postgres \
  > cuggu_backup.sql

# 2. RDS PostgreSQL 인스턴스 생성 (ap-northeast-2)
#    - db.t4g.micro (프리티어) 또는 db.t4g.small
#    - Multi-AZ: 초기엔 불필요
#    - Storage: 20GB gp3

# 3. RDS에 데이터 import
psql -h cuggu-db.xxx.ap-northeast-2.rds.amazonaws.com \
  -U postgres -d cuggu \
  < cuggu_backup.sql

# 4. DATABASE_URL 환경변수 변경
DATABASE_URL="postgresql://postgres:password@cuggu-db.xxx.rds.amazonaws.com:5432/cuggu"
```

Drizzle ORM 사용 중이라 코드 변경 없음. 연결 문자열만 바꾸면 됨.

---

## 6. 추천 경로

```
1인 운영 기준:

  운영 부담 최소화 → Amplify (Vercel 거의 그대로)
  비용 최적화      → SST/Lambda (트래픽 없을 때 $0에 가까움)
  제어권/확장 우선  → ECS Fargate (가장 유연하지만 관리 필요)
```

### 단계적 접근 (추천)

```
Phase 1 (지금): Vercel + Supabase 유지
  → 제품 안정화, 유저 확보에 집중

Phase 2 (트래픽 발생 시): SST/Lambda 또는 Amplify로 전환
  → DB: Supabase → RDS PostgreSQL
  → 컴퓨팅: Vercel → Lambda 또는 Amplify
  → 캐시: Upstash 유지

Phase 3 (스케일 필요 시): 필요에 따라 ECS Fargate 전환
  → cold start 이슈가 심각할 경우
  → WebSocket/실시간 기능 추가 시
```

### Fargate vs Lambda 선택 기준

| 기준 | Fargate | Lambda |
|---|---|---|
| 실행 방식 | 항상 실행 (최소 1개) | 요청 시에만 실행 |
| Cold Start | 없음 | 1~3초 (완화 가능) |
| 최소 비용 | $30~60/월 | 트래픽 없으면 $0 |
| 타임아웃 | 없음 | 최대 15분 |
| 적합한 경우 | 일정 트래픽, 실시간 기능 | 간헐적 트래픽, 비용 민감 |
