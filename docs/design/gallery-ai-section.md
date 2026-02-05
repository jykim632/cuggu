# 갤러리 탭 UI 개편 + AI 웨딩 사진 섹션 추가

> 작성일: 2026-02-05

## 목표

에디터 갤러리 탭을 '일반 사진' / 'AI 웨딩 사진' 두 섹션으로 분리하고, AI 생성 결과 4장 중 선택한 것만 갤러리에 추가

---

## 레이아웃 구조

```
GalleryTab.tsx
├── 헤더 ("갤러리")
├── 일반 사진 섹션 (기존 유지)
│   ├── 업로드 드롭존
│   └── 이미지 그리드
└── AI 웨딩 사진 섹션 (새로 추가, 접이식)
    ├── 신랑: 업로드 → 스타일 → 생성 → 결과 4장
    ├── 신부: 업로드 → 스타일 → 생성 → 결과 4장
    └── [선택한 사진 갤러리에 추가] 버튼
```

---

## 파일 구조

```
components/editor/tabs/
├── GalleryTab.tsx                 # 리팩터링 (메인)
└── gallery/
    ├── GalleryImageGrid.tsx       # 이미지 그리드 분리
    ├── AIPhotoSection.tsx         # AI 섹션 래퍼 (접이식)
    └── AIPhotoGenerator.tsx       # 신랑/신부 개별 생성 UI
```

---

## 구현 단계

### 1단계: 폴더 구조 생성
- `components/editor/tabs/gallery/` 폴더 생성

### 2단계: GalleryImageGrid 분리
- 현재 GalleryTab 163-183줄의 이미지 그리드를 별도 컴포넌트로 분리
- Props: `images`, `onRemove`

### 3단계: AIPhotoGenerator 구현

기존 ai-photos 컴포넌트 재사용:
- `AIPhotoUploader` - 그대로 import
- `StyleSelector` - 그대로 import
- `GenerationProgress` - 그대로 import
- `ResultGallery` - **다중 선택 지원하도록 수정**

```tsx
interface AIPhotoGeneratorProps {
  role: 'GROOM' | 'BRIDE';
  onSelectionChange: (selectedUrls: string[]) => void;
  credits: number;
  onCreditsUpdate: (remaining: number) => void;
}
```

상태 관리 (로컬 state):
- `image: File | null`
- `style: AIStyle | null`
- `generating: boolean`
- `result: AIGenerationResult | null`
- `selectedUrls: string[]` ← 다중 선택

### 3-1단계: ResultGallery 다중 선택 지원

기존 ResultGallery 수정 또는 새 컴포넌트:

```tsx
// 변경 전
selectedImage: string | null;
onSelectImage: (url: string) => void;

// 변경 후
selectedImages: string[];
onToggleImage: (url: string) => void;  // 토글 방식
```

- 클릭 시 선택/해제 토글
- 선택된 이미지 개수 표시 ("2장 선택됨")

### 4단계: AIPhotoSection 구현

```tsx
interface AIPhotoSectionProps {
  invitationId: string;
  onAddToGallery: (urls: string[]) => void;
}
```

- 접이식 UI (ChevronDown/Up)
- 신랑/신부 AIPhotoGenerator 2개
- 크레딧 조회 (`/api/user/credits`)
- "갤러리에 추가" 버튼 (선택된 이미지가 있을 때만 활성화)

### 5단계: GalleryTab 리팩터링

```tsx
<div className="space-y-6">
  {/* 헤더 */}
  {/* 에러 메시지 */}

  {/* 일반 사진 섹션 */}
  <section>
    <h3>일반 사진</h3>
    <업로드 드롭존 />
    <GalleryImageGrid images={...} onRemove={...} />
  </section>

  {/* AI 웨딩 사진 섹션 */}
  <AIPhotoSection
    invitationId={invitation.id}
    onAddToGallery={handleAddAIPhotos}
  />
</div>
```

---

## 상태 관리

| 상태 | 위치 | 용도 |
|------|------|------|
| AI 생성 진행상황 | AIPhotoGenerator 로컬 | 일시적 (새로고침 시 초기화 OK) |
| 선택된 이미지 URL | AIPhotoSection 로컬 | 갤러리 추가 전까지만 유지 |
| 갤러리 이미지 배열 | invitation-editor store | 영구 저장 (자동 저장) |

---

## API 사용

### AI 생성
기존 `/api/ai/generate` 그대로 사용 (수정 불필요)

### 갤러리 추가
기존 invitation-editor store 활용:

```tsx
const handleAddAIPhotos = (selectedUrls: string[]) => {
  const current = invitation.gallery?.images || [];
  updateInvitation({
    gallery: {
      ...invitation.gallery,
      images: [...current, ...selectedUrls],
    },
  });
};
```

→ 2초 후 자동 저장 트리거 (기존 로직)

---

## 핵심 파일

| 파일 | 역할 |
|------|------|
| `components/editor/tabs/GalleryTab.tsx` | 리팩터링 대상 |
| `app/dashboard/ai-photos/components/AIPhotoUploader.tsx` | 재사용 |
| `app/dashboard/ai-photos/components/StyleSelector.tsx` | 재사용 |
| `app/dashboard/ai-photos/components/GenerationProgress.tsx` | 재사용 |
| `app/dashboard/ai-photos/components/ResultGallery.tsx` | 다중 선택 지원 수정 |
| `stores/invitation-editor.ts` | 갤러리 추가 시 연동 (수정 불필요) |

---

## 검증 방법

1. **일반 업로드 테스트**
   - 이미지 업로드 → 그리드에 표시 → 삭제 가능

2. **AI 생성 테스트**
   - 증명사진 업로드 → 스타일 선택 → 생성 버튼 클릭
   - 로딩 UI 표시 → 결과 4장 표시
   - 다중 선택 (1~4장) → "갤러리에 추가" 클릭

3. **갤러리 추가 확인**
   - 일반 사진 그리드에 AI 사진 추가됨
   - PreviewPanel에서 미리보기 반영
   - 저장 후 새로고침해도 유지

4. **크레딧 확인**
   - 생성 후 크레딧 차감 반영
   - 크레딧 부족 시 버튼 비활성화
