# AI 사진 생성 시스템 구현 계획 (cuggu-rke)

> 별도 에이전트가 실행 가능한 상세 구현 계획
>
> **작성일**: 2026-02-04
> **우선순위**: P0 (핵심 차별화 기능)

---

## 1. 목표 & 범위

### 목표
증명 사진 1장을 업로드하면 AI로 웨딩 컨셉 사진 4장을 자동 생성하는 시스템 구축

### 범위 (MVP - Phase 1)
- ✅ 이미지 업로드 (multipart/form-data)
- ✅ 얼굴 감지 검증 (Azure Face API)
- ✅ AI 사진 생성 (Replicate API + Flux 모델)
- ✅ 배치 생성 (4장)
- ✅ 크레딧 차감 로직
- ✅ 파일 스토리지 (AWS S3)
- ✅ 생성 이력 저장 (aiGenerations 테이블)

### 제외 사항 (Phase 2)
- ❌ NestJS 마이크로서비스
- ❌ ComfyUI self-hosting
- ❌ LoRA fine-tuning

---

## 2. 기술 스택

| 구분 | 기술 | 이유 |
|------|------|------|
| AI 생성 | Replicate API (Flux) | Phase 1 빠른 구현, $0.04/이미지 |
| 얼굴 감지 | Azure Face API | 무료 티어 30,000회/월 |
| 파일 스토리지 | AWS S3 | 안정성, 확장성 |
| 런타임 | Next.js API Routes | 풀스택 1명, Serverless |

---

## 3. 구현 단계 (순서대로)

### Step 1: 환경 변수 설정
```bash
# .env.local
REPLICATE_API_TOKEN="r8_xxx"
AZURE_FACE_API_KEY="xxx"
AZURE_FACE_ENDPOINT="https://xxx.cognitiveservices.azure.com/"
AWS_REGION="ap-northeast-2"
AWS_ACCESS_KEY_ID="xxx"
AWS_SECRET_ACCESS_KEY="xxx"
S3_BUCKET_NAME="cuggu-images"
```

### Step 2: 라이브러리 설치
```bash
pnpm add replicate @azure/cognitiveservices-face @azure/ms-rest-azure-js
pnpm add @aws-sdk/client-s3 @aws-sdk/lib-storage
```

### Step 3: 크레딧 헬퍼 구현
**파일**: `lib/credits.ts`

```typescript
import { db } from '@/db';
import { users, aiGenerations } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * 크레딧 잔액 확인
 */
export async function checkCredits(userId: string): Promise<{
  hasCredits: boolean;
  balance: number
}> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { aiCredits: true },
  });

  if (!user) throw new Error('User not found');

  return {
    hasCredits: user.aiCredits > 0,
    balance: user.aiCredits,
  };
}

/**
 * 크레딧 차감 (트랜잭션)
 *
 * @throws Error if insufficient credits or race condition
 */
export async function deductCredits(userId: string, amount: number = 1): Promise<void> {
  const result = await db
    .update(users)
    .set({
      aiCredits: db.$raw(`ai_credits - ${amount}`),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning({ aiCredits: users.aiCredits });

  // Race condition 체크
  if (result.length === 0 || result[0].aiCredits < 0) {
    // 롤백
    await db
      .update(users)
      .set({ aiCredits: db.$raw(`ai_credits + ${amount}`) })
      .where(eq(users.id, userId));

    throw new Error('Insufficient credits');
  }
}

/**
 * 크레딧 환불 (생성 실패 시)
 */
export async function refundCredits(userId: string, amount: number = 1): Promise<void> {
  await db
    .update(users)
    .set({
      aiCredits: db.$raw(`ai_credits + ${amount}`),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}
```

### Step 4: Azure Face API 얼굴 감지
**파일**: `lib/face-detection.ts`

```typescript
import { FaceClient } from '@azure/cognitiveservices-face';
import { CognitiveServicesCredentials } from '@azure/ms-rest-azure-js';

const credentials = new CognitiveServicesCredentials(
  process.env.AZURE_FACE_API_KEY!
);
const client = new FaceClient(
  credentials,
  process.env.AZURE_FACE_ENDPOINT!
);

/**
 * 이미지에서 얼굴 감지
 *
 * @returns true if exactly 1 face detected
 */
export async function detectFace(imageBuffer: Buffer): Promise<{
  success: boolean;
  faceCount: number;
  error?: string;
}> {
  try {
    const faces = await client.face.detectWithStream(imageBuffer, {
      returnFaceId: false,
      returnFaceLandmarks: false,
      returnFaceAttributes: [],
    });

    if (faces.length === 0) {
      return {
        success: false,
        faceCount: 0,
        error: '얼굴이 감지되지 않았습니다'
      };
    }

    if (faces.length > 1) {
      return {
        success: false,
        faceCount: faces.length,
        error: '1명의 얼굴만 업로드해주세요'
      };
    }

    return { success: true, faceCount: 1 };
  } catch (error) {
    console.error('Face detection error:', error);
    return {
      success: false,
      faceCount: 0,
      error: '얼굴 감지 실패'
    };
  }
}
```

### Step 5: AWS S3 업로드
**파일**: `lib/s3.ts`

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { createId } from '@paralleldrive/cuid2';

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

/**
 * S3에 이미지 업로드
 *
 * @param buffer - 이미지 버퍼
 * @param prefix - 폴더 경로 (예: 'ai-photos')
 * @returns 공개 URL
 */
export async function uploadToS3(
  buffer: Buffer,
  contentType: string,
  prefix: string = 'ai-photos'
): Promise<string> {
  const key = `${prefix}/${createId()}.png`;

  const upload = new Upload({
    client: s3,
    params: {
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read', // 공개 읽기 권한
    },
  });

  await upload.done();

  // S3 공개 URL
  return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}
```

### Step 6: Replicate API 연동
**파일**: `lib/replicate.ts`

```typescript
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

export type AIStyle = 'CLASSIC' | 'MODERN' | 'VINTAGE' | 'ROMANTIC' | 'CINEMATIC';

const STYLE_PROMPTS: Record<AIStyle, string> = {
  CLASSIC: 'elegant traditional Korean wedding hanbok, soft lighting, professional studio photography',
  MODERN: 'contemporary wedding dress, minimalist background, natural light, editorial style',
  VINTAGE: 'vintage wedding attire, warm sepia tones, romantic atmosphere, film photography',
  ROMANTIC: 'romantic wedding scene, soft focus, dreamy lighting, pastel colors',
  CINEMATIC: 'cinematic wedding portrait, dramatic lighting, high fashion, magazine cover',
};

/**
 * Replicate로 웨딩 사진 4장 생성
 *
 * @param imageUrl - 원본 사진 URL (S3)
 * @param style - 웨딩 스타일
 * @returns 생성된 4장의 URL 배열
 */
export async function generateWeddingPhotos(
  imageUrl: string,
  style: AIStyle
): Promise<{
  urls: string[];
  replicateId: string;
  cost: number;
}> {
  const prompt = STYLE_PROMPTS[style];

  // Flux 모델 사용 (Replicate)
  const output = await replicate.run(
    "black-forest-labs/flux-1.1-pro",
    {
      input: {
        prompt: `${prompt}, based on this face reference`,
        image: imageUrl,
        num_outputs: 4,
        aspect_ratio: "3:4",
        output_format: "png",
        output_quality: 90,
      },
    }
  ) as string[];

  // Replicate는 배열로 4개 URL 반환
  if (!Array.isArray(output) || output.length !== 4) {
    throw new Error('Unexpected Replicate output format');
  }

  // 비용 계산 ($0.04 per image)
  const cost = 4 * 0.04;

  return {
    urls: output,
    replicateId: 'prediction_id', // Replicate API에서 반환
    cost,
  };
}
```

### Step 7: AI 생성 API 구현
**파일**: `app/api/ai/generate/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users, aiGenerations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { checkCredits, deductCredits, refundCredits } from '@/lib/credits';
import { detectFace } from '@/lib/face-detection';
import { uploadToS3 } from '@/lib/s3';
import { generateWeddingPhotos, AIStyle } from '@/lib/replicate';

export async function POST(request: NextRequest) {
  try {
    // 1. 인증 확인
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. 사용자 조회
    const user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 3. FormData 파싱
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const style = formData.get('style') as AIStyle;

    if (!image || !style) {
      return NextResponse.json(
        { error: 'Image and style are required' },
        { status: 400 }
      );
    }

    // 4. 파일 검증
    if (!image.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      );
    }

    if (image.size > 10 * 1024 * 1024) { // 10MB
      return NextResponse.json(
        { error: 'File too large (max 10MB)' },
        { status: 400 }
      );
    }

    // 5. 크레딧 확인
    const { hasCredits, balance } = await checkCredits(user.id);
    if (!hasCredits) {
      return NextResponse.json(
        { error: 'Insufficient credits', balance },
        { status: 402 } // Payment Required
      );
    }

    // 6. 이미지 버퍼 변환
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 7. 얼굴 감지
    const faceResult = await detectFace(buffer);
    if (!faceResult.success) {
      return NextResponse.json(
        { error: faceResult.error },
        { status: 400 }
      );
    }

    // 8. 크레딧 차감 (트랜잭션)
    await deductCredits(user.id, 1);

    // 9. 원본 이미지 S3 업로드
    let originalUrl: string;
    try {
      originalUrl = await uploadToS3(buffer, image.type, 'ai-originals');
    } catch (error) {
      // 업로드 실패 시 크레딧 환불
      await refundCredits(user.id, 1);
      throw error;
    }

    // 10. AI 생성 요청
    let generatedUrls: string[];
    let replicateId: string;
    let cost: number;

    try {
      const result = await generateWeddingPhotos(originalUrl, style);
      generatedUrls = result.urls;
      replicateId = result.replicateId;
      cost = result.cost;
    } catch (error) {
      // AI 생성 실패 시 크레딧 환불
      await refundCredits(user.id, 1);

      // 생성 실패 이력 저장
      await db.insert(aiGenerations).values({
        userId: user.id,
        originalUrl,
        style,
        status: 'FAILED',
        creditsUsed: 0, // 환불됨
        cost: 0,
      });

      throw error;
    }

    // 11. 생성 이력 저장
    const [generation] = await db.insert(aiGenerations).values({
      userId: user.id,
      originalUrl,
      style,
      generatedUrls,
      status: 'COMPLETED',
      creditsUsed: 1,
      cost,
      replicateId,
      completedAt: new Date(),
    }).returning();

    // 12. 응답
    return NextResponse.json({
      success: true,
      data: {
        id: generation.id,
        originalUrl: generation.originalUrl,
        generatedUrls: generation.generatedUrls,
        style: generation.style,
        remainingCredits: balance - 1,
      },
    });

  } catch (error) {
    console.error('AI generation error:', error);
    return NextResponse.json(
      { error: 'AI 생성 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
```

### Step 8: 생성 이력 조회 API
**파일**: `app/api/ai/generations/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users, aiGenerations } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 최근 20개 생성 이력
    const generations = await db.query.aiGenerations.findMany({
      where: eq(aiGenerations.userId, user.id),
      orderBy: [desc(aiGenerations.createdAt)],
      limit: 20,
    });

    return NextResponse.json({
      success: true,
      data: generations,
      remainingCredits: user.aiCredits,
    });
  } catch (error) {
    console.error('Get generations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Step 9: 최종 선택 API
**파일**: `app/api/ai/select/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users, aiGenerations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { generationId, selectedUrl } = await request.json();

    // 선택 저장
    const [updated] = await db
      .update(aiGenerations)
      .set({ selectedUrl })
      .where(
        and(
          eq(aiGenerations.id, generationId),
          eq(aiGenerations.userId, user.id)
        )
      )
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: 'Generation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { selectedUrl: updated.selectedUrl },
    });
  } catch (error) {
    console.error('Select photo error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## 4. 보안 & 에러 처리

### 파일 검증
- ✅ MIME type 체크 (image/*)
- ✅ 파일 크기 제한 (10MB)
- ✅ 얼굴 감지 필수

### Rate Limiting (Upstash Redis)
**파일**: `lib/rate-limit.ts`

```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function rateLimit(userId: string): Promise<boolean> {
  const key = `ratelimit:ai:${userId}`;
  const limit = 5; // 5회/10분
  const window = 600; // 10분

  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, window);
  }

  return count <= limit;
}
```

**사용:**
```typescript
// app/api/ai/generate/route.ts 에 추가
const allowed = await rateLimit(user.id);
if (!allowed) {
  return NextResponse.json(
    { error: 'Rate limit exceeded' },
    { status: 429 }
  );
}
```

### 에러 시나리오
| 에러 | 처리 |
|------|------|
| 크레딧 부족 | 402 Payment Required, 크레딧 차감 안 함 |
| 얼굴 미감지 | 400 Bad Request, 크레딧 차감 안 함 |
| 2명 이상 얼굴 | 400 Bad Request, 크레딧 차감 안 함 |
| 파일 크기 초과 | 400 Bad Request, 크레딧 차감 안 함 |
| S3 업로드 실패 | 500, 크레딧 환불 |
| Replicate 실패 | 500, 크레딧 환불, 실패 이력 저장 |
| Race condition | 차감 실패 시 자동 롤백 |

---

## 5. 환경 변수 설정

### Replicate API
1. https://replicate.com/account/api-tokens
2. 토큰 생성
3. `.env.local`에 `REPLICATE_API_TOKEN` 추가

### Azure Face API
1. Azure Portal → Cognitive Services → Face 생성
2. 무료 티어 F0 선택 (30,000회/월)
3. 키와 엔드포인트 복사
4. `.env.local`에 추가

### AWS S3
1. AWS Console → S3 → 버킷 생성 (`cuggu-images`)
2. 리전 선택 (예: `ap-northeast-2` 서울)
3. 버킷 정책 설정 (공개 읽기 권한):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::cuggu-images/*"
    }
  ]
}
```
4. IAM 사용자 생성 (S3 Full Access)
5. Access Key 생성
6. `.env.local`에 추가

### Upstash Redis
1. https://console.upstash.com → Redis 생성
2. REST API URL/Token 복사
3. `.env.local`에 추가

---

## 6. 검증 방법

### 1. 크레딧 로직 테스트
```typescript
// test/credits.test.ts
import { checkCredits, deductCredits, refundCredits } from '@/lib/credits';

// 크레딧 확인
const { balance } = await checkCredits(userId);
console.log('Balance:', balance); // 2

// 크레딧 차감
await deductCredits(userId, 1);
const { balance: newBalance } = await checkCredits(userId);
console.log('New Balance:', newBalance); // 1

// 크레딧 환불
await refundCredits(userId, 1);
const { balance: refunded } = await checkCredits(userId);
console.log('Refunded Balance:', refunded); // 2
```

### 2. E2E 테스트
1. 증명 사진 업로드 (1명 얼굴)
2. 스타일 선택 (CLASSIC)
3. 생성 요청
4. 4장 생성 확인
5. 크레딧 차감 확인 (2 → 1)
6. 생성 이력 조회
7. 최종 사진 선택

### 3. 에러 케이스 테스트
- 크레딧 0일 때 생성 요청 → 402
- 얼굴 없는 사진 업로드 → 400
- 2명 얼굴 사진 업로드 → 400
- 11MB 파일 업로드 → 400

---

## 7. 핵심 파일 (Critical Files)

### 백엔드
1. **`/lib/credits.ts`** - 크레딧 차감/환불/확인 (트랜잭션)
2. **`/lib/face-detection.ts`** - Azure Face API 얼굴 감지
3. **`/lib/s3.ts`** - AWS S3 업로드
4. **`/lib/replicate.ts`** - Replicate AI 생성
5. **`/lib/rate-limit.ts`** - Rate limiting
6. **`/app/api/ai/generate/route.ts`** - AI 생성 API
7. **`/app/api/ai/generations/route.ts`** - 이력 조회 API
8. **`/app/api/ai/select/route.ts`** - 최종 선택 API

### 프론트엔드 (별도 작업)
- `/components/ai/AIPhotoGenerator.tsx`
- `/components/ai/StyleSelector.tsx`
- `/app/dashboard/ai-photos/page.tsx`

---

## 8. 주의사항

### 절대 건드리면 안 되는 부분
- `lib/credits.ts`의 트랜잭션 로직 (Race condition 방지)
- `deductCredits` 함수의 `db.$raw` SQL (원자성 보장)
- 크레딧 환불 로직 (실패 시 자동 환불)

### 바꿔도 되는 부분
- AI 스타일 프롬프트 (STYLE_PROMPTS)
- 파일 크기 제한 (현재 10MB)
- Rate limit 설정 (현재 5회/10분)
- 생성 이미지 개수 (현재 4장)

### 비용 주의
- Replicate: $0.04/이미지 × 4장 = $0.16/회
- 월 1,000회 생성 시: $160 (약 21만원)
- 무료 플랜 2회 × 1,000명 = $320 (약 42만원)
- **Phase 2 전환 시점**: 월 5,000회 이상

---

## 9. 다음 단계

### 구현 후 확인사항
1. ✅ Replicate API 정상 호출
2. ✅ 크레딧 차감/환불 정상 작동
3. ✅ 얼굴 감지 정확도 (거짓 양성/음성)
4. ✅ S3 업로드 속도
5. ✅ 전체 생성 시간 (목표: 30초 이내)

### Phase 2 마이그레이션 준비
- `/api/ai/*` 엔드포인트 → NestJS 마이크로서비스
- Replicate → ComfyUI self-hosting
- 비용 최적화 ($0.04 → $0.01)

---

## 10. 완료 조건

- [ ] 모든 파일 구현 완료
- [ ] 환경 변수 설정 완료
- [ ] 크레딧 로직 테스트 통과
- [ ] E2E 테스트 통과 (1회 전체 플로우)
- [ ] 에러 케이스 테스트 통과
- [ ] 코드 리뷰 완료
- [ ] 문서화 완료

---

**이 계획서를 에이전트에게 전달하면 즉시 구현 가능합니다.**
