# AI Photo Generation Frontend 구현 계획

## 결정 사항

**선택**: Option A (개별 처리 - 신랑/신부 각각 업로드)

**이유**:
- 현재 Backend API 그대로 사용 가능
- 비용 효율적 ($0.16/회 × 2명 = $0.32)
- 즉시 출시 가능
- Phase 2에서 ComfyUI로 업그레이드

---

## 1. 브랜치 전략

```bash
# 현재: feature/ai-photo-generation
# 새 브랜치: feature/ai-photo-frontend

git checkout feature/ai-photo-generation
git checkout -b feature/ai-photo-frontend
```

---

## 2. 환경 변수 설정 (필수)

### 2.1 추가 필요한 환경 변수

```env
# AWS S3
AWS_REGION="ap-northeast-2"
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="..."
S3_BUCKET_NAME="cuggu-ai-photos"

# Upstash Redis
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
```

### 2.2 필드명 수정

**문제**: `lib/ai/env.ts`는 `AZURE_FACE_ENDPOINT` 요구, 현재 `.env.local`은 `AZURE_FACE_API_ENDPOINT`

**해결**: `.env.local`에서 `AZURE_FACE_API_ENDPOINT` → `AZURE_FACE_ENDPOINT` 이름 변경

---

## 3. Frontend 구조

```
app/dashboard/ai-photos/
  ├── page.tsx                    # 메인 페이지
  └── components/
      ├── AIPhotoUploader.tsx     # 이미지 업로드
      ├── StyleSelector.tsx       # 스타일 선택
      ├── GenerationProgress.tsx  # 생성 진행 상태
      └── ResultGallery.tsx       # 결과 4장 표시
```

---

## 4. UX 플로우

### 4.1 초기 화면
```
┌─────────────────────────────────┐
│   AI 웨딩 사진 생성             │
│   증명 사진으로 웨딩 화보 만들기 │
│   잔여 크레딧: 2회              │
└─────────────────────────────────┘

┌─ 💙 신랑 사진 ──────────────────┐
│ [이미지 업로드 영역]             │
│ 1명의 얼굴만 업로드해주세요      │
└─────────────────────────────────┘

┌─ 💗 신부 사진 ──────────────────┐
│ [이미지 업로드 영역]             │
│ 1명의 얼굴만 업로드해주세요      │
└─────────────────────────────────┘
```

### 4.2 스타일 선택
```
[ 클래식 ] [ 모던 ] [ 빈티지 ] [ 로맨틱 ] [ 시네마틱 ]
```

### 4.3 생성 중
```
🔄 신랑 AI 사진 생성 중...
클래식 스타일로 4장의 사진을 만들고 있습니다
예상 소요 시간: 20-40초
[진행 바 애니메이션]
```

### 4.4 결과 표시
```
신랑 AI 사진 (4장)          🔄 재생성 (1 크레딧)

┌─────┬─────┐
│ [1] │ [2] │  ← 클릭 시 선택 표시
├─────┼─────┤
│ [3] │ [4] │
└─────┴─────┘

✅ 1장 선택됨
```

### 4.5 완료
```
[ ❤️ 청첩장에 적용하기 ]
```

---

## 5. 핵심 컴포넌트

### 5.1 AIPhotoUploader

**역할**: 이미지 파일 업로드 (드래그 앤 드롭 + 파일 선택)

**Props**:
```typescript
interface AIPhotoUploaderProps {
  role: 'GROOM' | 'BRIDE';
  image: File | null;
  onImageChange: (file: File | null) => void;
  disabled?: boolean;
}
```

**기능**:
- 드래그 앤 드롭 영역
- 파일 선택 버튼
- 이미지 미리보기
- 용량 표시 (2.4 MB / 10 MB)
- 제거 버튼

---

### 5.2 StyleSelector

**역할**: 5가지 웨딩 스타일 선택

**Props**:
```typescript
interface StyleSelectorProps {
  selectedStyle: AIStyle | null;
  onStyleSelect: (style: AIStyle) => void;
  disabled?: boolean;
}

type AIStyle = 'CLASSIC' | 'MODERN' | 'VINTAGE' | 'ROMANTIC' | 'CINEMATIC';
```

**스타일 정보**:
- CLASSIC: 전통적인 한국식 웨딩
- MODERN: 미니멀하고 세련된 스타일
- VINTAGE: 따뜻한 복고풍
- ROMANTIC: 부드럽고 몽환적인 분위기
- CINEMATIC: 드라마틱한 화보 스타일

---

### 5.3 ResultGallery

**역할**: 생성된 4장 이미지 표시 및 선택

**Props**:
```typescript
interface ResultGalleryProps {
  role: 'GROOM' | 'BRIDE';
  images: string[];
  selectedImage: string | null;
  onSelectImage: (url: string) => void;
  onRegenerate: () => void;
}
```

**기능**:
- 2×2 Grid 레이아웃
- 클릭 시 선택 표시 (체크마크)
- 재생성 버튼
- Framer Motion 애니메이션

---

## 6. 상태 관리

### 6.1 페이지 State

```typescript
// 신랑
const [groomImage, setGroomImage] = useState<File | null>(null);
const [groomStyle, setGroomStyle] = useState<AIStyle | null>(null);
const [groomGenerating, setGroomGenerating] = useState(false);
const [groomResult, setGroomResult] = useState<{
  id: string;
  urls: string[];
  selected: string | null;
} | null>(null);

// 신부 (동일 구조)
const [brideImage, setBrideImage] = useState<File | null>(null);
// ...

// 공통
const [credits, setCredits] = useState(2);
const [error, setError] = useState<string | null>(null);
```

---

## 7. API 연동

### 7.1 AI 생성 API

**Endpoint**: `POST /api/ai/generate`

**Request**:
```typescript
const formData = new FormData();
formData.append('image', imageFile);
formData.append('style', 'CLASSIC');

const response = await fetch('/api/ai/generate', {
  method: 'POST',
  body: formData,
});
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "generatedUrls": ["url1", "url2", "url3", "url4"],
    "style": "CLASSIC",
    "remainingCredits": 1
  }
}
```

**Error**:
- 402: 크레딧 부족
- 400: 얼굴 미감지
- 429: Rate limit

---

### 7.2 크레딧 조회 API (신규)

**Endpoint**: `GET /api/user/credits`

**Response**:
```json
{
  "success": true,
  "credits": 2
}
```

**구현 위치**: `app/api/user/credits/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, session.user.email),
    columns: { aiCredits: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    credits: user.aiCredits,
  });
}
```

---

## 8. 실제 서비스 연동 테스트

### 8.1 테스트 순서

1. **환경 변수 설정**
   - Replicate 토큰 발급
   - Azure Face API 리소스 생성 (무료 F0)
   - AWS S3 버킷 생성 + IAM 사용자
   - Upstash Redis 생성

2. **Backend 단독 테스트** (cURL)
   ```bash
   curl -X POST http://localhost:3000/api/ai/generate \
     -F "image=@test.jpg" \
     -F "style=CLASSIC"
   ```

3. **Frontend 통합 테스트**
   - `/dashboard/ai-photos` 접속
   - 신랑 사진 업로드 → 생성 → 결과 확인
   - 신부 사진도 동일하게 테스트

4. **에러 케이스 테스트**
   - 크레딧 0일 때
   - 얼굴 없는 사진
   - 2명 얼굴 사진
   - 11MB 파일
   - Rate limit (5회 연속)

### 8.2 예상 비용

- 1회 생성: $0.16 (4장 × $0.04)
- 테스트 20회: $3.20

---

## 9. Critical Files

### 생성 파일
1. `app/dashboard/ai-photos/page.tsx` - 메인 페이지 로직
2. `app/dashboard/ai-photos/components/AIPhotoUploader.tsx` - 업로드 UI
3. `app/dashboard/ai-photos/components/StyleSelector.tsx` - 스타일 선택
4. `app/dashboard/ai-photos/components/GenerationProgress.tsx` - 진행 상태
5. `app/dashboard/ai-photos/components/ResultGallery.tsx` - 결과 표시
6. `app/api/user/credits/route.ts` - 크레딧 조회 API

### 수정 파일
7. `.env.local` - 환경 변수 추가 (AWS, Upstash) + 필드명 수정

---

## 10. 검증 방법

### 10.1 기능 검증
- [ ] 신랑 사진 업로드 → 스타일 선택 → 생성 → 4장 표시 → 1장 선택
- [ ] 신부 사진도 동일하게 성공
- [ ] 크레딧 차감 확인 (2 → 0)
- [ ] 청첩장 적용 버튼 활성화

### 10.2 에러 검증
- [ ] 크레딧 부족 시 "Insufficient credits" 메시지
- [ ] 얼굴 없는 사진 → "얼굴이 감지되지 않았습니다"
- [ ] Rate limit → "Please try again later"

### 10.3 UX 검증
- [ ] 로딩 중 진행 바 애니메이션
- [ ] 생성 시간 20-40초 이내
- [ ] 모바일에서도 정상 작동

---

## 11. 완료 조건

- [ ] 환경 변수 설정 완료 (AWS, Azure, Replicate, Upstash)
- [ ] Frontend 5개 컴포넌트 구현
- [ ] 크레딧 조회 API 구현
- [ ] 실제 서비스 연동 테스트 성공 (신랑 + 신부)
- [ ] 에러 케이스 테스트 통과
- [ ] 모바일 반응형 확인

---

## 12. 예상 작업 시간

- 환경 변수 설정: 1-2시간
- 컴포넌트 구현: 4-6시간
- API 연동 및 테스트: 2-3시간
- 스타일링 및 모바일: 1-2시간

**총 8-13시간**
