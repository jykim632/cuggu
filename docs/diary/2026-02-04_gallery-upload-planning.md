# 갤러리 이미지 업로드 + S3/CloudFront 통합 설계

> 작성일: 2026-02-04
> 상태: 설계 완료, 구현 대기

## 배경

에디터의 갤러리 탭 UI는 있지만 실제 업로드가 미구현 상태. `handleImageUpload`가 `console.log`만 찍고 끝남. 이번에 S3 업로드 + CloudFront CDN + Sharp 최적화 + AI 이미지 S3 복사까지 한번에 구현.

## 작업 범위

1. S3 헬퍼 리팩토링 (CloudFront fallback 지원)
2. 갤러리 업로드 API 구현
3. GalleryTab 업로드 기능 구현 + 버그 수정
4. Sharp 이미지 최적화
5. AI 생성 이미지 S3 복사 (Replicate CDN → S3)

---

## 아키텍처 결정

### S3 프리픽스 구조

```
cuugu-ai-photos/
├── ai-originals/          # AI용 원본 사진 (기존, 유지)
├── ai-generated/{userId}/ # AI 생성 결과물 (NEW - Replicate에서 복사)
└── gallery/{userId}/      # 사용자 직접 업로드 갤러리 사진 (NEW)
```

- AI 이미지와 갤러리 이미지를 S3 프리픽스로 물리적 분리
- userId별 폴더로 관리 용이성 확보

### DB 스키마: 변경 없음

현재 컬럼으로 충분:
- `invitations.galleryImages text[]` → 사용자 업로드 갤러리
- `invitations.aiPhotoUrl varchar` → 선택된 AI 메인 사진
- `aiGenerations.generatedUrls text[]` → AI 생성 이미지들 (별도 테이블)

이미 다른 컬럼/테이블에 분리되어 있음.

### CloudFront

아직 AWS CloudFront 배포가 없음. 코드에서 `CLOUDFRONT_DOMAIN` 환경변수를 optional로 두고, 없으면 S3 직접 URL fallback.

---

## Step 1: S3 헬퍼 리팩토링

**파일:** `lib/ai/s3.ts`

현재 `uploadToS3()`가 S3 직접 URL string을 리턴. CloudFront 도메인이 없어도 동작하되, 나중에 추가하면 자동 전환되도록 수정.

**변경 사항:**
```typescript
// 추가: CloudFront URL 생성 헬퍼
export function getPublicUrl(key: string): string {
  const domain = process.env.CLOUDFRONT_DOMAIN;
  if (domain) {
    return `https://${domain}/${key}`;
  }
  return `https://${env.S3_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
}

// uploadToS3() 리턴값을 { key, url }로 변경
export async function uploadToS3(
  buffer: Buffer,
  contentType: string,
  prefix: string = 'ai-photos'
): Promise<{ key: string; url: string }> {
  const ext = contentType === 'image/webp' ? 'webp'
    : contentType === 'image/png' ? 'png' : 'jpg';
  const key = `${prefix}/${createId()}.${ext}`;
  // ... upload 로직 동일
  return { key, url: getPublicUrl(key) };
}

// 추가: URL에서 이미지를 다운로드하여 S3에 업로드
export async function copyToS3(
  imageUrl: string,
  prefix: string
): Promise<{ key: string; url: string }> {
  const response = await fetch(imageUrl);
  const buffer = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get('content-type') || 'image/png';
  return uploadToS3(buffer, contentType, prefix);
}
```

**호환성 처리:**
- `uploadToS3` 리턴 타입이 `string` → `{ key, url }` 로 바뀜
- 기존 호출부 수정: `app/api/ai/generate/route.ts:165`
  - `originalUrl = await uploadToS3(...)` → `const { url: originalUrl } = await uploadToS3(...)`

---

## Step 2: 환경변수 업데이트

**파일:** `lib/ai/env.ts`

```typescript
CLOUDFRONT_DOMAIN: z.string().optional(),
```

**파일:** `.env.example`
```bash
CLOUDFRONT_DOMAIN="" # 없으면 S3 직접 URL 사용
```

---

## Step 3: 갤러리 상수 추가

**파일:** `lib/ai/constants.ts`

```typescript
export const GALLERY_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_BATCH: 10, // 한 번에 최대 10장
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'] as const,
  FREE_LIMIT: 20,
  PREMIUM_LIMIT: 100,
  OPTIMIZE: {
    WIDTH: 1200,
    HEIGHT: 1200,
    QUALITY: 85,
    FORMAT: 'webp' as const,
  },
} as const;

// WebP 시그니처 추가
export const FILE_SIGNATURES = {
  PNG: [0x89, 0x50, 0x4e, 0x47] as const,
  JPEG_START: [0xff, 0xd8, 0xff] as const,
  WEBP_RIFF: [0x52, 0x49, 0x46, 0x46] as const,
} as const;
```

---

## Step 4: Sharp 이미지 최적화 모듈

**새 파일:** `lib/ai/image-optimizer.ts`

```bash
pnpm add sharp
pnpm add -D @types/sharp
```

```typescript
import sharp from 'sharp';
import { GALLERY_CONFIG } from './constants';

export async function optimizeForGallery(buffer: Buffer): Promise<Buffer> {
  const { WIDTH, HEIGHT, QUALITY } = GALLERY_CONFIG.OPTIMIZE;
  return sharp(buffer)
    .resize(WIDTH, HEIGHT, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toBuffer();
}
```

비용 효과: 10MB 원본 → ~200-400KB WebP (97% 절감)

---

## Step 5: 파일 시그니처 검증 유틸

**새 파일:** `lib/ai/validation.ts`

기존 `generate/route.ts`에 인라인으로 있던 시그니처 검증을 공용 함수로 추출.

```typescript
export function isValidImageBuffer(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50
    && buffer[2] === 0x4e && buffer[3] === 0x47;
  const isJPEG = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isWebP = buffer.slice(0, 4).toString() === 'RIFF'
    && buffer.slice(8, 12).toString() === 'WEBP';
  return isPNG || isJPEG || isWebP;
}
```

---

## Step 6: 갤러리 업로드 API

**새 파일:** `app/api/upload/gallery/route.ts`

**플로우:**
1. 인증 확인 (NextAuth session)
2. FormData 파싱 (files[] + invitationId)
3. Invitation 소유권 확인 (userId 매칭)
4. Tier별 한도 체크 (FREE: 20, PREMIUM: 100)
5. 각 파일: MIME 검증 → 크기 검증 → 시그니처 검증 → Sharp 최적화 → S3 업로드
6. DB 업데이트 (galleryImages 배열에 추가)
7. 응답 반환

**핵심 로직:**
```typescript
export async function POST(req: NextRequest) {
  // 1. 인증
  const session = await auth();
  if (!session?.user?.email) return 401;

  // 2. FormData
  const formData = await req.formData();
  const files = formData.getAll('files') as File[];
  const invitationId = formData.get('invitationId') as string;

  // 3-4. 소유권 + 한도 체크
  const limit = user.premiumPlan === 'PREMIUM'
    ? GALLERY_CONFIG.PREMIUM_LIMIT : GALLERY_CONFIG.FREE_LIMIT;

  // 5. 파일별 처리 (병렬)
  const results = await Promise.allSettled(
    files.slice(0, available).map(async (file) => {
      const buffer = Buffer.from(await file.arrayBuffer());
      if (!isValidImageBuffer(buffer)) throw new Error('invalid');
      const optimized = await optimizeForGallery(buffer);
      return uploadToS3(optimized, 'image/webp', `gallery/${user.id}`);
    })
  );

  // 6. DB 업데이트
  const uploadedUrls = results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value.url);
  const updatedImages = [...(invitation.galleryImages || []), ...uploadedUrls];
  await db.update(invitations).set({ galleryImages: updatedImages });

  return { urls: uploadedUrls, total: updatedImages.length };
}
```

---

## Step 7: GalleryTab 수정

**파일:** `components/editor/tabs/GalleryTab.tsx`

### 버그 수정 (line 79)
```diff
- src={image.url}
+ src={image}
```
스키마가 `z.array(z.string().url())`인데 `image.url`로 접근하면 undefined.

### 업로드 핸들러 구현
- `useState`로 `uploading` 상태 관리
- FormData로 파일 전송 → `/api/upload/gallery`
- 응답 URL을 store `updateInvitation()`으로 반영 → 자동 저장 트리거
- 프론트 검증: 파일 크기 초과 시 즉시 에러

### 로딩 UI
- 업로드 중 스피너 표시
- 업로드 버튼 disabled 처리
- 현재 장수/한도 동적 표시

---

## Step 8: AI 생성 이미지 S3 복사

**파일:** `app/api/ai/generate/route.ts`

AI 생성 완료 후, Replicate CDN URL들을 S3로 복사:

```typescript
// AI 생성 요청 후
const replicateUrls = result.urls;

// 생성된 이미지를 S3로 복사 (병렬)
const s3Results = await Promise.allSettled(
  replicateUrls.map(url => copyToS3(url, `ai-generated/${user.id}`))
);

// S3 URL로 교체 (복사 실패 시 Replicate URL 유지)
generatedUrls = replicateUrls.map((replicateUrl, i) => {
  const result = s3Results[i];
  return result.status === 'fulfilled' ? result.value.url : replicateUrl;
});
```

### 추가 버그 수정
- `generate/route.ts:243` - `balance` 변수 스코프 밖 참조 버그
- `uploadToS3` 호출부 리턴 타입 변경 대응

---

## Step 9: next.config.ts 이미지 도메인 설정

**파일:** `next.config.ts`

```typescript
images: {
  remotePatterns: [
    { protocol: 'https', hostname: '*.amazonaws.com' },
    { protocol: 'https', hostname: '*.cloudfront.net' },
  ],
},
```

---

## 수정 파일 요약

| 파일 | 작업 |
|------|------|
| `lib/ai/s3.ts` | `getPublicUrl()` 추가, `uploadToS3()` 리턴 변경, `copyToS3()` 추가 |
| `lib/ai/env.ts` | `CLOUDFRONT_DOMAIN` optional 추가 |
| `lib/ai/constants.ts` | `GALLERY_CONFIG` 추가, WebP 시그니처 추가 |
| `lib/ai/image-optimizer.ts` | **새 파일** - Sharp 최적화 |
| `lib/ai/validation.ts` | **새 파일** - 파일 시그니처 검증 |
| `app/api/upload/gallery/route.ts` | **새 파일** - 갤러리 업로드 API |
| `components/editor/tabs/GalleryTab.tsx` | 버그 수정 + 업로드 구현 + 로딩 UI |
| `app/api/ai/generate/route.ts` | S3 복사 로직 + uploadToS3 호출 수정 + balance 버그 수정 |
| `.env.example` | `CLOUDFRONT_DOMAIN` 추가 |
| `next.config.ts` | 이미지 도메인 허용 |

## 구현 순서

1. `pnpm add sharp` (의존성)
2. `lib/ai/env.ts` + `.env.example` (환경변수)
3. `lib/ai/constants.ts` (상수)
4. `lib/ai/validation.ts` (검증 유틸)
5. `lib/ai/image-optimizer.ts` (Sharp)
6. `lib/ai/s3.ts` (S3 리팩토링)
7. `app/api/ai/generate/route.ts` (기존 코드 호환성 수정 + AI S3 복사)
8. `app/api/upload/gallery/route.ts` (갤러리 API)
9. `components/editor/tabs/GalleryTab.tsx` (프론트)
10. `next.config.ts` (이미지 도메인)

## 검증 방법

1. **갤러리 업로드**: 에디터에서 이미지 업로드 → S3 `gallery/` 확인 → 갤러리 렌더링
2. **Sharp 최적화**: 10MB 원본 → S3 저장 크기 200-400KB WebP 확인
3. **한도 체크**: FREE 유저 21장째 업로드 시 에러 반환
4. **AI S3 복사**: AI 생성 후 `ai-generated/` 프리픽스에 파일 존재
5. **CloudFront fallback**: `CLOUDFRONT_DOMAIN` 없을 때 S3 직접 URL 리턴
6. **빌드**: `pnpm build` 성공
