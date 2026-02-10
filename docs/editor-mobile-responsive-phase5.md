# Phase 5: 에디터 탭 컴포넌트 모바일 반응형 정밀 수정

## 배경

Phase 1~4에서 레이아웃 쉘(3패널→1패널 전환, MobileBottomNav, TabletTabStrip 등)과 기본 Tailwind 반응형 클래스(grid-cols, 패딩)를 적용 완료. 하지만 360~390px 뷰포트에서 개별 탭 내부의 버튼 행 오버플로우, 카드 패딩, 터치 타겟 부족 등 세부 문제가 다수 남아있음.

이번 단계는 **Tailwind 반응형 클래스 수정만으로 해결** — 새 컴포넌트 없음, 로직 변경 없음.

---

## 수정 대상 파일 (7개)

### 1. TemplateTab.tsx

**파일**: `components/editor/tabs/TemplateTab.tsx`

| # | 위치 | 문제 | 수정 내용 |
|---|------|------|-----------|
| A | 액션 버튼 행 (line 391~426) | isCustomActive일 때 3요소 오버플로우 (**CRITICAL**) | 외부 div → `flex flex-col gap-3 md:flex-row md:items-center md:justify-between`, 버튼 그룹 → `w-full md:w-auto justify-end`, AI 생성 버튼 → `flex-1 md:flex-none` |
| B | 모드 선택 세그먼트 (line 347~376) | 360px에서 텍스트 빡빡 | `px-3` → `px-2 md:px-3`, `gap-1.5` → `gap-1 md:gap-1.5` |
| C | 내 테마 라이브러리 카드 (line 442) | 카드 패딩 과다 | `p-6` → `p-4 md:p-6` |
| D | 테마 메타데이터 행 (line 488) | 3개 뱃지 오버플로우 | `flex-wrap` 추가 |
| E | 무료 템플릿 카드 (line 543) | 카드 패딩 과다 | `p-6` → `p-4 md:p-6` |
| F | 프리미엄 CTA 레이아웃 (line 599~618) | 360px에서 콘텐츠 ~216px로 좁음 | 외부 `p-4 md:p-6`, 내부 `gap-3 md:gap-4`, 아이콘 `w-10 h-10 md:w-12 md:h-12` |
| G | 커스텀 테마 활성 표시 (line 430) | 우측 텍스트 한 줄 초과 | 우측 `<span>` → `hidden md:inline` |

### 2. VenueTab.tsx

**파일**: `components/editor/tabs/VenueTab.tsx`

| # | 위치 | 문제 | 수정 내용 |
|---|------|------|-----------|
| A | 카드 패딩 (line 237, 266) | 카드 패딩 과다 | `p-6` → `p-4 md:p-6` |
| B | 주소 검색 드롭다운 (line 189~195) | 모바일에서 뷰포트 밖으로 나감 | `isMobile` 체크 추가, mobile일 때 `left: 16, width: vw - 32` |
| C | 주소 표시 텍스트 (line 352~354) | 긴 주소 오버플로우 | `truncate` 추가 |

### 3. SettingsTab.tsx

**파일**: `components/editor/tabs/SettingsTab.tsx`

| # | 위치 | 문제 | 수정 내용 |
|---|------|------|-----------|
| A | 통계 카드 숫자 (line 300) | 큰 숫자 넘침 | `text-2xl` → `text-lg md:text-2xl` |
| B | 드래그 핸들 (line 77) | 터치 타겟 ~28px로 부족 | `p-1.5` → `p-2.5 md:p-1.5` (모바일 ~36px) |
| C | 섹션 카드 패딩 (line 164, 222, 242, 282, 295) | 카드 패딩 과다 | 모두 `p-6` → `p-4 md:p-6` |

### 4. BasicInfoTab.tsx

**파일**: `components/editor/tabs/BasicInfoTab.tsx`

| # | 위치 | 문제 | 수정 내용 |
|---|------|------|-----------|
| A | 신랑/신부 카드 (line 82, 200) | 카드 패딩 과다 | `p-6` → `p-4 md:p-6` |

### 5. AccountTab.tsx

**파일**: `components/editor/tabs/AccountTab.tsx`

| # | 위치 | 문제 | 수정 내용 |
|---|------|------|-----------|
| A | 부모님 계좌 헤더 (line 240, 282, 355, 397) | 360px에서 텍스트+버튼 빡빡 | `gap-2` 추가하여 최소 갭 보장 |

### 6. AIResultGallery.tsx

**파일**: `components/editor/tabs/gallery/AIResultGallery.tsx`

| # | 위치 | 문제 | 수정 내용 |
|---|------|------|-----------|
| A | 헤더 레이아웃 (line 36) | 텍스트+버튼 간 공간 부족 | `gap-2` 추가, 재생성 버튼에 `flex-shrink-0` |

### 7. GalleryImageGrid.tsx

**파일**: `components/editor/tabs/gallery/GalleryImageGrid.tsx`

| # | 위치 | 문제 | 수정 내용 |
|---|------|------|-----------|
| A | 카드 패딩 (line 19) | 카드 패딩 과다 | `p-6` → `p-4 md:p-6` |

---

## 수정하지 않는 파일

| 파일 | 이유 |
|------|------|
| `GreetingTab.tsx` | 세로 스택 레이아웃, 풀폭 textarea — 이미 모바일 안전 |
| `RsvpTab.tsx` | 체크박스/토글 리스트 — 이미 모바일 안전 |
| `AIPhotoSection.tsx` | 이미 `md:grid-cols-2`, 모바일에서 1컬럼 — OK |
| `AIStreamingGallery.tsx` | Phase 4에서 `flex-col sm:flex-row` 적용 완료 |
| `ImageModal.tsx` | 풀스크린 오버레이 — 이미 모바일 안전 |

---

## 구현 순서

모든 변경이 Tailwind 클래스 수정이므로 병렬 수행 가능. 파일별로 한 번에 처리.

1. **TemplateTab.tsx** — 가장 많은 변경 (7개 포인트)
2. **VenueTab.tsx** — 드롭다운 포지셔닝 로직 포함
3. **SettingsTab.tsx** — 5개 카드 패딩 + 통계 + 드래그
4. **BasicInfoTab.tsx, AccountTab.tsx, AIResultGallery.tsx, GalleryImageGrid.tsx** — 단순 패딩/갭

---

## 검증 체크리스트

- [ ] `npx tsc --noEmit` — 타입 에러 없음
- [ ] Chrome DevTools → iPhone 12 (390px) 확인
- [ ] Chrome DevTools → Galaxy S21 (360px) 확인
- [ ] **TemplateTab**: AI 생성 버튼 행 오버플로우 없음, 테마 라이브러리 뱃지 줄바꿈 정상
- [ ] **VenueTab**: 드롭다운이 화면 안에 표시됨, 주소 텍스트 truncate
- [ ] **SettingsTab**: 통계 숫자 넘치지 않음, 드래그 핸들 터치 용이
- [ ] 기존 md 이상 뷰포트에서 디자인 변화 없음 (regression 없음)

---

## 수정 패턴 요약

| 패턴 | Before | After | 적용 파일 |
|------|--------|-------|-----------|
| 카드 패딩 축소 | `p-6` | `p-4 md:p-6` | Template, Venue, Settings, BasicInfo, GalleryImageGrid |
| 버튼 행 스택 | `flex justify-between` | `flex flex-col gap-3 md:flex-row md:justify-between` | TemplateTab |
| 갭 보장 | `flex justify-between` | `flex justify-between gap-2` | AccountTab, AIResultGallery |
| 메타데이터 줄바꿈 | `flex gap-2` | `flex gap-2 flex-wrap` | TemplateTab |
| 터치 타겟 확대 | `p-1.5` | `p-2.5 md:p-1.5` | SettingsTab |
| 텍스트 축소 | `text-2xl` | `text-lg md:text-2xl` | SettingsTab |
| 모바일 숨김 | `<span>` | `<span className="hidden md:inline">` | TemplateTab |
| 텍스트 truncate | `text-sm` | `text-sm truncate` | VenueTab |
