# 모바일 에디터 전용 UI 신규 구축

## Context

`/m/editor/[id]` 라우트 분리 + UA 리다이렉트는 완료. 현재 모바일 라우트가 데스크톱 컴포넌트(TopBar, EditorPanel, 탭 14개)를 그대로 재사용 중 → 모바일 전용 UI로 전부 새로 만든다.

**공유하는 것**: Zustand store (`stores/invitation-editor.ts`), API routes, 타입, lib 유틸리티
**새로 만드는 것**: 모바일 에디터 쉘 + 탭 컴포넌트 전체

---

## 디렉토리 구조

```
components/editor/mobile/
├── MobileTopBar.tsx              # 모바일 전용 상단바
├── MobileEditorShell.tsx         # 탭 라우팅 + 레이아웃 래퍼
├── MobileBottomNav.tsx           # (이미 생성됨, 이동)
├── MobilePreviewOverlay.tsx      # (이미 생성됨, 이동)
├── MobileStepIndicator.tsx       # 그룹 내 탭 인디케이터 (1/2, 2/2)
└── tabs/
    ├── MobileTemplateTab.tsx     # 템플릿 선택 + AI 테마
    ├── MobileBasicInfoTab.tsx    # 신랑/신부 정보
    ├── MobileVenueTab.tsx        # 날짜/장소
    ├── MobileGreetingTab.tsx     # 인사말
    ├── MobileGalleryTab.tsx      # 갤러리 + AI 사진
    ├── MobileAccountTab.tsx      # 계좌 정보
    ├── MobileRsvpTab.tsx         # 참석 확인
    └── MobileSettingsTab.tsx     # 설정
```

---

## 모바일 디자인 원칙

1. **터치 타겟 최소 44px** — 버튼, 체크박스, 라디오 모두
2. **싱글 컬럼 기본** — 2컬럼은 큰 카드(템플릿 그리드)만
3. **바텀시트 > 드롭다운** — 선택 UI는 바텀시트 패턴
4. **카드 패딩 p-4** — 데스크톱 p-6 대신
5. **풀폭 입력 필드** — 좌우 여백 최소화
6. **네이티브 입력 활용** — date type, tel type, inputMode="numeric"
7. **Safe area 대응** — 하단 네비 + 노치 영역

---

## 쉘 컴포넌트 상세

### MobileTopBar

데스크톱 TopBar와 완전 별개. 모바일 전용 컴팩트 레이아웃.

```
┌─[←]──[신랑♥신부]──[●]──[발행]─┐   44px 높이
```

- 좌: 뒤로가기 아이콘 (→ /dashboard)
- 중앙: 제목 (truncate)
- 우측: 저장 상태 dot(●) + 발행 아이콘 버튼
- 발행 상태 뱃지 → 제목 옆 작은 dot

### MobileEditorShell

EditorPanel 대체. 탭 렌더링 + 스크롤 + 하단 패딩.

```tsx
<div className="flex-1 overflow-y-auto pb-24">  {/* BottomNav 높이 확보 */}
  <div className="px-4 py-4">
    <MobileStepIndicator />  {/* 그룹 내 위치 표시 */}
    {renderActiveTab()}
  </div>
</div>
```

### MobileStepIndicator

그룹 내 탭 위치를 보여주는 미니 인디케이터.
- "정보" 그룹 → "기본 정보 (1/2)" 또는 dot indicator
- 좌우 스와이프 힌트 or 이전/다음 버튼

---

## 탭 컴포넌트 상세

### 1. MobileTemplateTab (데스크톱: 659줄)

**섹션 구성:**
- AI 테마 생성기: 프롬프트 textarea + 모드 토글(빠른/정밀) + 생성 버튼
- 내 테마 라이브러리: 세로 스크롤 카드 리스트
- 무료 템플릿: 2컬럼 그리드 (카드 탭하여 선택)
- 프리미엄 CTA

**모바일 변경점:**
- 모드 선택: 세그먼트 컨트롤 → 풀폭 2버튼 토글
- 생성 버튼: 풀폭 sticky bottom (크레딧 표시 포함)
- 템플릿 그리드: 2컬럼 유지, 카드 높이 축소
- 테마 라이브러리: 적용/삭제 버튼 → 스와이프 액션 또는 롱프레스 메뉴

**공유 로직:** AI 테마 API 호출, 테마 CRUD, `useCredits()` 훅

### 2. MobileBasicInfoTab (데스크톱: 382줄)

**섹션 구성:**
- 신랑 정보 폼 (이름, 가족관계, 부모님, 전화)
- 신부 정보 폼 (동일 구조)

**모바일 변경점:**
- 신랑/신부 → 탭 또는 세그먼트 컨트롤로 전환 (한 번에 하나만 표시)
- 가족 표시 방식 라디오 → 큰 카드형 선택지 (44px+)
- 부모님 정보 → 아코디언 접기
- 관계 선택 → 바텀시트
- `inputMode="tel"` for 전화번호

### 3. MobileVenueTab (데스크톱: 400줄)

**섹션 구성:**
- 날짜/시간 선택
- 예식장 정보 (이름, 홀, 전화)
- 주소 검색 + 지도
- 교통편

**모바일 변경점:**
- 날짜: `<input type="date">` 네이티브 활용
- 시간: `<input type="time">` 네이티브 활용
- 주소 검색: 풀폭 입력 + 결과를 바텀시트로 표시 (Portal 드롭다운 대신)
- 지도: 풀폭, 탭하면 카카오맵 앱 열기 링크
- 교통편: textarea 풀폭

### 4. MobileGreetingTab (데스크톱: 76줄)

**섹션 구성:**
- 인사말 textarea
- 예시 인사말 카드 3개

**모바일 변경점:**
- textarea rows 늘리기 (8→10), 풀폭
- 예시 카드: 세로 스택, 탭하면 바로 적용
- 거의 그대로 써도 됨 (가장 단순)

### 5. MobileGalleryTab (데스크톱: 184줄 + 하위 6개)

**섹션 구성:**
- 사진 업로드 (드래그앤드롭 → 모바일에서는 탭 업로드)
- 업로드된 사진 그리드
- AI 사진 생성 섹션

**모바일 변경점:**
- 드롭존 → "사진 추가" 버튼 (네이티브 파일 피커 트리거)
- 이미지 그리드: 3컬럼, 정사각형 썸네일
- AI 사진 생성: 아코디언으로 접힘, 펼치면 풀폭 UI
- AI 결과: 2x2 그리드 유지, 선택 토글은 체크 오버레이
- ImageModal: 풀스크린 (이미 모바일 안전)

### 6. MobileAccountTab (데스크톱: 441줄)

**섹션 구성:**
- 신랑 측 계좌 (본인 + 부모님)
- 신부 측 계좌 (본인 + 부모님)

**모바일 변경점:**
- 신랑/신부 → 세그먼트 컨트롤로 전환
- 은행 선택 → 바텀시트 (네이티브 select 대신)
- 계좌번호: `inputMode="numeric"`
- 부모님 계좌: 아코디언, "추가" 버튼 크게
- 계좌 삭제: 스와이프 or 롱프레스

### 7. MobileRsvpTab (데스크톱: 129줄)

**섹션 구성:**
- RSVP 활성화 토글
- 필드 선택 체크박스 목록

**모바일 변경점:**
- 토글/체크박스 사이즈 키우기
- 거의 그대로 (이미 단순한 구조)

### 8. MobileSettingsTab (데스크톱: 317줄)

**섹션 구성:**
- 섹션 순서 드래그
- 캘린더 스타일
- 비밀번호 보호
- 통계

**모바일 변경점:**
- 드래그 핸들: 48px 터치 타겟
- @dnd-kit 터치 센서 활성화 (이미 지원)
- 통계 카드: 1컬럼 스택 (2컬럼 → 1컬럼)
- 캘린더 선택: 바텀시트

---

## 구현 우선순위

### Phase 1: 쉘 + 단순 탭 (빠른 골격 완성)

1. `MobileTopBar` — 모바일 전용 상단바
2. `MobileEditorShell` — 탭 라우팅 래퍼
3. `MobileStepIndicator` — 그룹 내 탭 위치
4. `MobileGreetingTab` — 가장 단순 (76줄 → ~60줄)
5. `MobileRsvpTab` — 단순 토글 (129줄 → ~100줄)
6. `app/m/editor/[id]/page.tsx` 업데이트 — 모바일 컴포넌트 연결

### Phase 2: 핵심 탭

7. `MobileBasicInfoTab` — 신랑/신부 세그먼트 + 폼
8. `MobileVenueTab` — 날짜/장소/지도
9. `MobileTemplateTab` — 템플릿 + AI 테마

### Phase 3: 고급 탭

10. `MobileGalleryTab` — 업로드 + AI 사진
11. `MobileAccountTab` — 계좌 폼
12. `MobileSettingsTab` — 드래그 + 통계

---

## page.tsx 변경

```tsx
// app/m/editor/[id]/page.tsx
import { MobileTopBar } from '@/components/editor/mobile/MobileTopBar';
import { MobileEditorShell } from '@/components/editor/mobile/MobileEditorShell';
import { MobileBottomNav } from '@/components/editor/mobile/MobileBottomNav';
import { MobilePreviewOverlay, MobilePreviewFAB } from '@/components/editor/mobile/MobilePreviewOverlay';

// 더 이상 데스크톱 EditorPanel, PreviewPanel, TabletTabStrip 미사용
// useBreakpoint도 불필요 (이 라우트는 모바일 전용)
```

---

## 검증

각 Phase 완료 시:

1. `npx tsc --noEmit`
2. Chrome DevTools → iPhone 12 (390px) / Galaxy S21 (360px)
3. 각 탭 진입 → 폼 입력 → 저장 확인 (Zustand + auto-save)
4. MobileBottomNav 그룹 전환
5. MobilePreviewOverlay 열기/닫기
6. 데스크톱 `/editor/[id]`에 영향 없음 확인 (regression)
