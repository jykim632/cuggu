# S3 저장 구조 개선 및 다운로드 기능 계획

> 작성일: 2026-02-06 (업데이트)
> 상태: 계획 완료

---

## 1. 현재 상태

### 1.1 S3 폴더 구조

```
s3://cuggu-images/
├── ai-originals/              # AI 생성용 원본 사진
│   └── {cuid}.jpg             ← userId 없음 ❌
│
├── ai-generated/              # AI 생성된 결과물
│   └── {userId}/              ← model 구분 없음 ❌
│       └── {cuid}.png
│
└── gallery/                   # 사용자 직접 업로드
    └── {userId}/
        └── {cuid}.webp
```

### 1.2 DB 스키마 (aiGenerations)

```typescript
{
  id, userId,
  originalUrl,      // 원본 사진 S3 URL
  generatedUrls,    // 생성된 4장 배열
  selectedUrl,      // 선택된 1장
  style,            // CLASSIC/MODERN/VINTAGE/ROMANTIC/CINEMATIC
  status, creditsUsed, cost, replicateId,
  createdAt, completedAt
}
// ⚠️ model 필드 없음 → 어떤 AI 모델로 생성했는지 추적 불가
```

### 1.3 AI 모델 현황

| 모델 | ID | 비용/장 | 얼굴 보존 | 속도 |
|------|-----|---------|----------|------|
| Flux 1.1 Pro | `flux-pro` | $0.04 | Fair | Fast |
| Flux Dev | `flux-dev` | $0.025 | Fair | Fast |
| PhotoMaker | `photomaker` | $0.0095 | Excellent | Medium |

### 1.4 URL 접근 방식

- **CloudFront**: ✅ 연결됨 (`dda3x7lt3qxf0.cloudfront.net`)
- **CDN URL**: `https://dda3x7lt3qxf0.cloudfront.net/{key}`
- **접근 권한**: Public (URL 알면 누구나 접근 가능)

### 1.5 다운로드 기능

- **현재 상태**: 미구현 ❌
- UI 다운로드 버튼 없음
- 다운로드 API 없음

---

## 2. 개선 목표

### 2.1 모델별 S3 폴더 분리

**목적:**
- 비용/사용량 분석 (모델별 폴더 용량 집계)
- 품질 비교/A/B 테스트
- 특정 모델 결과물 일괄 삭제/백업 용이

### 2.2 다운로드 기능 추가

**범위:**
- 개별 이미지 다운로드
- 일괄 ZIP 다운로드 (선택한 여러 장)

### 2.3 URL 보안 (하이브리드)

| 용도 | URL 타입 | 이유 |
|------|---------|------|
| 청첩장 공개 뷰 | Public URL | 불특정 다수 접근, 캐싱 |
| 에디터 미리보기 | Public URL | 빈번한 렌더링 |
| **다운로드** | **Signed URL** | 소유권 검증, 명시적 다운로드 |

---

## 3. 목표 구조

### 3.1 S3 폴더 구조

```
s3://cuggu-images/
├── ai-originals/
│   └── {userId}/                    # userId 추가 ✅
│       └── {cuid}.jpg
│
├── ai-generated/
│   └── {modelId}/                   # 모델별 분리 ✅
│       └── {userId}/
│           └── {cuid}.png
│
└── gallery/
    └── {userId}/
        └── {cuid}.webp
```

**예시:**
```
ai-originals/user_abc123/clxyz789.jpg
ai-generated/flux-pro/user_abc123/cldef456.png
ai-generated/photomaker/user_abc123/clghi012.png
```

### 3.2 DB 스키마 변경

```typescript
// 새 enum 추가
export const aiModelEnum = pgEnum('ai_model', [
  'flux-pro',
  'flux-dev',
  'photomaker',
]);

// aiGenerations 테이블에 필드 추가
model: aiModelEnum('model').default('flux-pro').notNull(),  // 신규 ✅
```

---

## 4. 다운로드 기능 설계

### 4.1 개별 다운로드 API

**Endpoint:** `GET /api/ai/download`

**Query Parameters:**
- `url` (required): S3 URL
- `filename` (optional): 다운로드 파일명

**Flow:**
```
1. 세션 인증 확인
2. URL이 해당 사용자 소유인지 검증
3. S3 Presigned URL 생성 (5분 만료)
4. Redirect to presigned URL
```

**Response:**
- 성공: 302 Redirect
- 실패: 401/403/400 JSON error

### 4.2 ZIP 일괄 다운로드 API

**Endpoint:** `POST /api/ai/download/zip`

**Request Body:**
```json
{
  "urls": ["https://...", "https://..."],
  "filename": "ai-wedding-photos.zip"
}
```

**제한:**
- 최대 20장
- 스트리밍 방식 (메모리 효율)

**Flow:**
```
1. 세션 인증 확인
2. 모든 URL 소유권 검증
3. 각 이미지 fetch → archiver로 ZIP 스트리밍
4. Response로 ZIP 파일 전송
```

### 4.3 소유권 검증 로직

```typescript
// lib/ai/ownership.ts
async function verifyImageOwnership(
  userId: string,
  imageUrl: string
): Promise<boolean> {
  // 1. aiGenerations 테이블에서 검색
  //    - originalUrl 일치
  //    - generatedUrls 배열에 포함
  //    - selectedUrl 일치

  // 2. invitations.galleryImages 배열에서 검색

  return found;
}
```

### 4.4 Signed URL 구현

**방식:** S3 Presigned URL

```typescript
// lib/ai/s3.ts 추가
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

async function getSignedDownloadUrl(
  url: string,
  filename?: string,
  expiresIn: number = 300  // 5분
): Promise<string> {
  const key = extractS3Key(url);
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${filename}"`,
  });
  return getSignedUrl(s3Client, command, { expiresIn });
}

function extractS3Key(url: string): string {
  const urlObj = new URL(url);
  return urlObj.pathname.slice(1);  // 앞의 '/' 제거
}
```

---

## 5. UI 변경

### 5.1 AIResultGallery 수정

**파일:** `components/editor/tabs/gallery/AIResultGallery.tsx`

**추가 요소:**
- 헤더: "선택 다운로드 (N)", "전체 다운로드" 버튼
- 각 이미지 카드: 개별 다운로드 아이콘

**UX Flow:**
```
1. 사용자가 버튼 클릭
2. 로딩 스피너 표시
3. 1장 → 개별 다운로드 (리다이렉트)
   여러 장 → ZIP 다운로드 (blob → download)
4. 완료 토스트
```

---

## 6. 구현 계획

### Phase 1: DB + S3 구조 변경

| 순서 | 작업 | 파일 |
|------|------|------|
| 1 | aiModelEnum 추가 | `db/schema.ts` |
| 2 | model 필드 추가 | `db/schema.ts` |
| 3 | 마이그레이션 실행 | `pnpm drizzle-kit generate && migrate` |
| 4 | S3 prefix 변경 (originals) | `app/api/ai/generate/stream/route.ts` |
| 5 | S3 prefix 변경 (generated) | `app/api/ai/generate/stream/route.ts` |
| 6 | model 저장 로직 추가 | `app/api/ai/generate/stream/route.ts` |
| 7 | 동일 수정 | `app/api/ai/generate/route.ts` |

**변경 전:**
```typescript
// ai-originals
uploadToS3(buffer, image.type, 'ai-originals')

// ai-generated
copyToS3(replicateUrl, `ai-generated/${user.id}`)
```

**변경 후:**
```typescript
// ai-originals
uploadToS3(buffer, image.type, `ai-originals/${user.id}`)

// ai-generated
copyToS3(replicateUrl, `ai-generated/${modelId}/${user.id}`)
```

### Phase 2: 다운로드 기능

| 순서 | 작업 | 파일 |
|------|------|------|
| 1 | getSignedDownloadUrl 함수 | `lib/ai/s3.ts` |
| 2 | verifyImageOwnership 함수 | `lib/ai/ownership.ts` (신규) |
| 3 | 개별 다운로드 API | `app/api/ai/download/route.ts` (신규) |
| 4 | ZIP 다운로드 API | `app/api/ai/download/zip/route.ts` (신규) |
| 5 | UI 다운로드 버튼 | `components/editor/tabs/gallery/AIResultGallery.tsx` |

### 의존성 추가

```bash
pnpm add archiver @aws-sdk/s3-request-presigner
pnpm add -D @types/archiver
```

---

## 7. 파일 변경 목록

| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `db/schema.ts` | 수정 | aiModelEnum, model 필드 추가 |
| `app/api/ai/generate/route.ts` | 수정 | S3 prefix, model 저장 |
| `app/api/ai/generate/stream/route.ts` | 수정 | S3 prefix, model 저장 |
| `lib/ai/s3.ts` | 수정 | getSignedDownloadUrl 추가 |
| `lib/ai/ownership.ts` | **신규** | 소유권 검증 함수 |
| `app/api/ai/download/route.ts` | **신규** | 개별 다운로드 API |
| `app/api/ai/download/zip/route.ts` | **신규** | ZIP 다운로드 API |
| `components/editor/tabs/gallery/AIResultGallery.tsx` | 수정 | 다운로드 버튼 UI |

---

## 8. 기존 호환성

### 8.1 기존 URL

- **변경 없음**: 기존 S3 URL 그대로 동작
- S3는 모든 경로를 서빙하므로 신규 경로와 기존 경로 모두 유효

### 8.2 기존 DB 레코드

- `model` 필드: DEFAULT 'flux-pro'로 자동 채워짐
- 기존 데이터 수정 불필요

### 8.3 S3 파일 마이그레이션

- **즉시 마이그레이션 불필요**
- 신규 파일만 새 경로 사용
- 추후 배치 스크립트로 이동 가능 (선택)

---

## 9. 검증 방법

### Phase 1 검증

```bash
# 1. AI 사진 생성 실행 (UI에서)

# 2. S3 경로 확인
aws s3 ls s3://cuggu-images/ai-originals/{userId}/
aws s3 ls s3://cuggu-images/ai-generated/flux-pro/{userId}/
aws s3 ls s3://cuggu-images/ai-generated/photomaker/{userId}/

# 3. DB 확인
SELECT id, model, style FROM ai_generations
ORDER BY created_at DESC LIMIT 5;
```

### Phase 2 검증

1. **개별 다운로드**: 이미지 다운로드 버튼 클릭 → 파일 저장 확인
2. **ZIP 다운로드**: 여러 장 선택 → ZIP 파일 내용 확인
3. **권한 검증**: 다른 사용자 이미지 URL 접근 시 403 응답 확인

---

## 10. 리스크 및 대응

| 리스크 | 영향 | 대응책 |
|--------|------|--------|
| ZIP 생성 시 메모리 부족 | 서버 크래시 | 최대 20장 제한, 스트리밍 방식 |
| Presigned URL 만료 | 다운로드 실패 | 5분 만료 + 실패 시 재시도 안내 |
| 기존 URL 업데이트 실수 | 이미지 깨짐 | 기존 URL 변경하지 않음 |

---

## 11. 향후 계획

- [x] CloudFront 배포 연결 → CDN 캐시 활용 ✅ (`dda3x7lt3qxf0.cloudfront.net`)
- [ ] CloudFront Signed URL로 전환 (성능 개선)
- [ ] 오래된 AI 생성 결과 자동 정리 (S3 lifecycle policy)
- [ ] 사용자 탈퇴 시 S3 파일 일괄 삭제
- [ ] 전체 생성 이력 다운로드 (마이페이지)
