# AI 사진 생성 v2: Face Swap 파이프라인

> **작성일**: 2026-02-05
> **상태**: 설계 완료, 구현 대기
> **이전 버전**: `docs/ai-generation-plan.md` (Flux 프롬프트 기반)

---

## 1. 왜 바꾸는가

### 현재 방식의 한계

현재 파이프라인은 Flux Pro에 프롬프트로 얼굴 보존을 시도한다:

```
"keeping the exact same face, identical facial features, preserve the person's face"
```

**문제**: text-to-image 모델은 프롬프트로 얼굴 동일성을 보장할 수 없다.
- Flux Pro/Dev: `facePreservation: 'fair'` → 실질적으로 `poor`
- PhotoMaker: `facePreservation: 'excellent'` → "비슷한 사람"이지 "그 사람"이 아님
- 청첩장에 들어갈 사진은 **본인이어야 함**. "비슷한 사람"은 불가.

### 새 방식: Face Swap

1. 고품질 웨딩 사진을 먼저 만든다 (얼굴 무관)
2. 업로드된 증명사진의 얼굴을 정확히 교체한다

**핵심**: 생성(scene quality)과 얼굴 동일성(identity)을 분리해서 각각 최적화.

---

## 2. 모델 선택

### 조사한 모델들

| 모델 | 비용 | 멀티페이스 | 바디 보정 | 상업 라이선스 | 비고 |
|------|------|-----------|----------|-------------|------|
| **easel/advanced-face-swap** | $0.04 | O (2명) | O | O | **채택** |
| codeplugtech/face-swap | ~$0.01-0.02 | X | X | InsightFace 라이선스 이슈 | 1.6M runs |
| fofr/face-swap-with-ideogram | - | X | X | - | 스타일화 전용 |
| FLUX Kontext Pro | $0.04 | X | - | O | 얼굴 ~90% 보존 (100% 아님) |

### 채택: easel/advanced-face-swap

**선택 이유**:
- 커플 사진 동시 교체 (swap_image + swap_image_b)
- 얼굴뿐 아니라 피부톤, 인종 특징, 바디까지 보정
- 상업적 사용 가능 (Commercial license)
- gender 파라미터로 정확한 face-person 매칭
- hair_source 옵션 (원본/타겟 헤어스타일 선택)

**FLUX Kontext Pro를 선택하지 않은 이유**:
- 여전히 생성 모델이라 얼굴이 "재생성"됨 (100% 동일 보장 불가)
- 특히 한국인 얼굴에서 drift 가능성 (학습 데이터 편향)
- 단일 인물만 가능 (커플 사진 불가)

---

## 3. 파이프라인 아키텍처

### 라이브러리 모드 (기본, 1크레딧)

```
사전 준비: Flux Pro로 스타일별 베이스 이미지 생성 → S3 저장 → 큐레이션

유저 요청 시:
┌──────────────────────────────────────────────────────┐
│ 1. 신랑/신부 사진 업로드                                │
│ 2. 모드 선택: 커플 / 솔로(신랑) / 솔로(신부)             │
│ 3. 스타일 선택: 클래식/모던/빈티지/로맨틱/시네마틱          │
│ 4. 베이스 이미지 4장 랜덤 선택 (스타일+모드 기반)          │
│ 5. easel/advanced-face-swap × 4 (병렬)               │
│ 6. 결과 4장 → 유저 선택                                │
└──────────────────────────────────────────────────────┘
```

### 커스텀 모드 (프리미엄, 2크레딧)

```
┌──────────────────────────────────────────────────────┐
│ 1~3. 동일                                            │
│ 4. Flux Pro로 베이스 이미지 4장 실시간 생성              │
│ 5. easel/advanced-face-swap × 4 (병렬)               │
│ 6. 결과 4장 → 유저 선택                                │
└──────────────────────────────────────────────────────┘
```

### API 호출 상세 (easel/advanced-face-swap)

```javascript
// 커플 모드
const result = await replicate.run("easel/advanced-face-swap", {
  input: {
    target_image: baseWeddingPhotoUrl,  // 베이스 웨딩 사진
    swap_image: groomFaceUrl,           // 신랑 얼굴
    swap_image_b: brideFaceUrl,         // 신부 얼굴
    user_gender: "male",
    user_b_gender: "female",
    hair_source: "target",              // 베이스 이미지의 헤어스타일 유지
  },
});

// 솔로 모드
const result = await replicate.run("easel/advanced-face-swap", {
  input: {
    target_image: baseSoloPhotoUrl,
    swap_image: faceUrl,
    user_gender: "male",  // or "female"
    hair_source: "target",
  },
});
```

---

## 4. 베이스 이미지 전략 (하이브리드)

### 사전 생성 라이브러리 (기본)

스타일 5종 × 타입 3종 (솔로 신랑, 솔로 신부, 커플) = 15 카테고리
각 카테고리 최소 10장 = **총 150장 목표**

**S3 구조**:
```
s3://cuggu-assets/base-wedding/
├── CLASSIC/
│   ├── COUPLE/
│   │   ├── classic-couple-001.png
│   │   ├── classic-couple-002.png
│   │   └── ...
│   ├── SOLO_GROOM/
│   │   └── ...
│   └── SOLO_BRIDE/
│       └── ...
├── MODERN/
│   └── ...
├── VINTAGE/
│   └── ...
├── ROMANTIC/
│   └── ...
└── CINEMATIC/
    └── ...
```

**베이스 이미지 생성 프롬프트 (Flux Pro)**:

```
COUPLE - CLASSIC:
"A Korean couple in traditional wedding hanbok, elegant studio setting,
soft natural lighting, professional wedding photography, the groom in
a dark navy hanbok and the bride in a red and gold hanbok, both facing
slightly toward camera, warm atmosphere, high resolution, 3:4 aspect ratio"

SOLO_BRIDE - MODERN:
"A bride in a modern white wedding dress, minimalist white studio
background, natural soft lighting, editorial fashion photography,
facing camera with slight angle, clean composition, 3:4 aspect ratio"

COUPLE - CINEMATIC:
"A wedding couple in formal attire, dramatic golden hour lighting,
outdoor garden venue, cinematic depth of field, the groom in a black
tuxedo and the bride in an elegant white gown, magazine editorial style,
3:4 aspect ratio"
```

**베이스 이미지 요구사항**:
- 얼굴이 명확하게 보일 것 (정면 또는 약간 비스듬)
- 얼굴에 적절한 조명 (그림자로 얼굴 반쪽 가리지 않기)
- 머리카락이 얼굴을 가리지 않을 것
- 3:4 종횡비 (모바일 최적)
- 다양한 포즈/배경 (같은 스타일이라도 변화)

### 실시간 커스텀 생성 (프리미엄)

유저가 라이브러리에 만족하지 않을 때, Flux Pro로 새 베이스를 실시간 생성.
추가 비용: 1크레딧 (face swap 1 + 생성 1 = 총 2크레딧).

---

## 5. 비용 분석

| 항목 | 라이브러리 모드 | 커스텀 모드 | 현재 방식 |
|------|---------------|-----------|----------|
| 베이스 이미지 | $0 (사전 생성) | $0.16 (Flux ×4) | - |
| Face Swap | $0.16 (easel ×4) | $0.16 (easel ×4) | - |
| Flux 생성 | - | - | $0.16 (×4) |
| **합계/요청** | **$0.16** | **$0.32** | **$0.16** |
| **크레딧** | **1** | **2** | **1** |
| **얼굴 동일성** | **100%** | **100%** | **~50-70%** |

### 사전 생성 비용 (일회성)

150장 × $0.04 = **$6.00** (약 8,000원)
→ 품질 검수 후 탈락분 감안해 200장 생성: **$8.00**

---

## 6. 데이터 모델 변경

### 새 enum

```sql
CREATE TYPE generation_mode AS ENUM ('SOLO_GROOM', 'SOLO_BRIDE', 'COUPLE');
```

### aiGenerations 테이블 변경

```sql
ALTER TABLE ai_generations
  ADD COLUMN generation_mode generation_mode,
  ADD COLUMN groom_original_url VARCHAR(500),
  ADD COLUMN bride_original_url VARCHAR(500),
  ADD COLUMN base_image_urls TEXT[],
  ADD COLUMN generation_source VARCHAR(20);  -- 'library' | 'custom'

-- 기존 original_url은 하위 호환을 위해 유지 (nullable로)
ALTER TABLE ai_generations ALTER COLUMN original_url DROP NOT NULL;
```

### Drizzle 스키마 (db/schema.ts)

```typescript
export const generationModeEnum = pgEnum('generation_mode', [
  'SOLO_GROOM',
  'SOLO_BRIDE',
  'COUPLE',
]);

// aiGenerations 테이블에 추가
generationMode: generationModeEnum('generation_mode'),
groomOriginalUrl: varchar('groom_original_url', { length: 500 }),
brideOriginalUrl: varchar('bride_original_url', { length: 500 }),
baseImageUrls: text('base_image_urls').array(),
generationSource: varchar('generation_source', { length: 20 }),
```

---

## 7. 구현 파일 목록

### 신규 파일

| 파일 | 역할 |
|------|------|
| `lib/ai/face-swap.ts` | easel/advanced-face-swap Replicate 연동 |
| `lib/ai/base-images.ts` | 베이스 이미지 매니저 (랜덤 선택, 메타데이터) |
| `lib/ai/base-image-manifest.ts` | 스타일/타입별 베이스 이미지 URL 목록 |
| `scripts/generate-base-images.ts` | 베이스 이미지 일괄 생성 스크립트 |
| `app/dashboard/ai-photos/components/ModeSelector.tsx` | 커플/솔로 모드 선택 UI |

### 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `lib/ai/models.ts` | face swap 모델 정의 추가 |
| `lib/ai/replicate.ts` | 베이스 이미지 전용 프롬프트 (얼굴 참조 제거) |
| `app/api/ai/generate/route.ts` | 전체 파이프라인 교체 |
| `db/schema.ts` | generation_mode enum, 신규 필드 |
| `types/ai.ts` | GenerationMode, GenerationSource 타입 |
| `schemas/ai.ts` | 새 요청/응답 Zod 스키마 |
| `app/dashboard/ai-photos/page.tsx` | 새 UX 플로우 |
| `app/dashboard/ai-photos/components/AIPhotoUploader.tsx` | 커플 업로드 지원 |
| `app/dashboard/ai-photos/components/ResultGallery.tsx` | 커플 사진 표시 |

---

## 8. UX 플로우 변경

### 현재 (v1)

```
신랑 사진 업로드 → 스타일 선택 → 생성 → 선택
신부 사진 업로드 → 스타일 선택 → 생성 → 선택
→ 청첩장 적용
```

### 새 플로우 (v2)

```
[모드 선택]
├── 커플 사진
│   ├── 신랑 + 신부 사진 동시 업로드
│   ├── 스타일 선택
│   ├── 생성 소스: 라이브러리(1크레딧) / 커스텀(2크레딧)
│   ├── 생성 → 커플 사진 4장
│   └── 선택 → 청첩장 적용
│
├── 솔로 - 신랑
│   ├── 신랑 사진 업로드
│   ├── 스타일 선택
│   ├── 생성 소스 선택
│   ├── 생성 → 신랑 솔로 사진 4장
│   └── 선택
│
└── 솔로 - 신부
    ├── (위와 동일)
    └── 선택 → 청첩장 적용
```

---

## 9. 리스크 & 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| easel 모델 한국인 얼굴 품질 미달 | 높음 | 구현 전 테스트 이미지로 품질 검증 필수. 대안: codeplugtech, 자체 InsightFace |
| 베이스 이미지 다양성 부족 | 중간 | 초기 150장, 피드백 따라 추가 생성. 커스텀 모드로 보완 |
| easel 모델 다운타임/deprecation | 중간 | face-swap.ts를 인터페이스로 설계, 모델 교체 용이하게 |
| 조명/각도 불일치 | 중간 | 베이스 이미지를 정면/부드러운 조명 위주로 큐레이션 |
| 머리카락/목 경계 부자연스러움 | 낮음 | hair_source: 'target' 옵션으로 완화. easel이 바디까지 보정 |

---

## 10. 실행 순서

```
Phase 1: 기반 (face swap 서비스 + 모델 설정)
  → lib/ai/face-swap.ts
  → lib/ai/models.ts 수정

Phase 2: 데이터 (스키마 + 타입)
  → db/schema.ts 수정 + 마이그레이션
  → types/ai.ts 수정
  → schemas/ai.ts 수정

Phase 3: 베이스 이미지 (라이브러리 시스템)
  → lib/ai/base-images.ts
  → lib/ai/base-image-manifest.ts
  → scripts/generate-base-images.ts
  → 실제 베이스 이미지 150장 생성 + 큐레이션

Phase 4: API (파이프라인 교체)
  → app/api/ai/generate/route.ts 리팩토링
  → lib/ai/replicate.ts 수정 (베이스 전용 프롬프트)

Phase 5: 프론트엔드 (UX 변경)
  → ModeSelector.tsx 신규
  → AIPhotoUploader.tsx 수정
  → page.tsx 리팩토링
  → ResultGallery.tsx 수정

Phase 6: 테스트
  → 한국인 얼굴 face swap 품질 테스트
  → E2E: 업로드 → 생성 → 선택 → 적용
```

---

## 참고 자료

- [Replicate Face Swap Collection](https://replicate.com/collections/face-swap)
- [Easel AI on Replicate](https://replicate.com/blog/easel)
- [FLUX Kontext Pro](https://replicate.com/black-forest-labs/flux-kontext-pro) (비교 참고)
- 기존 구현: `docs/ai-generation-plan.md`, `docs/ai-photo-generation-flow.md`
