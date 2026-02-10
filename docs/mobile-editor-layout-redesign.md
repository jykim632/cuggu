# 모바일 에디터 레이아웃 리디자인

> 2026-02-10 | UX 디자이너 + UI 디자이너 + 프론트엔드 개발자 관점 종합 분석

## 현재 구조

```
┌──────────────────────┐
│ MobileTopBar         │ 44px fixed - ← 뒤로, "신랑 ♥ 신부", 저장dot, 발행
├──────────────────────┤
│ MobileStepIndicator  │ ~36px 조건부 - "← 인사말 1/4 →"
├──────────────────────┤
│                      │
│ MobileEditorShell    │ flex-1, overflow-y-auto, px-4 py-4, pb-24
│ (탭 콘텐츠 영역)      │ 미구현 탭은 데스크톱 컴포넌트 fallback
│                      │
│               [👁 FAB]│ fixed bottom-20 right-4, pink 원형
├──────────────────────┤
│ MobileBottomNav      │ 64px fixed - 디자인/정보/콘텐츠/설정 (4그룹)
└──────────────────────┘
```

**네비게이션**: BottomNav(4그룹) → 그룹 내 StepIndicator(← 1/4 →)의 2단계 구조

---

## 1. 근본 문제: 2단계 네비게이션

### UX 관점

- **하위 탭 발견 불가**: "콘텐츠" 탭을 눌렀을 때 인사말(1/4)만 보이고, 갤러리/계좌/RSVP가 숨어있다는 걸 사용자가 모를 수 있다. StepIndicator의 "← 1/4 →"가 네비게이션이라는 시각적 어포던스가 없다.
- **"콘텐츠" 그룹명 모호**: 인사말, 갤러리, 계좌정보, RSVP가 왜 "콘텐츠"인지 직관적이지 않다. 계좌번호 입력하려고 "콘텐츠"를 먼저 누를 사용자는 거의 없다.
- **그룹 간 불균형**: 디자인(1탭), 설정(1탭) vs 콘텐츠(4탭). 콘텐츠만 서브 네비게이션이 필요한 비대칭 구조.
- **한국 앱 멘탈 모델과 충돌**: 카카오톡, 네이버 등에서 하단 탭은 최종 목적지를 의미하는데, 여기서는 "폴더"처럼 작동한다.

### UI 관점

- **TopBar와 StepIndicator가 시각적으로 뒤섞임**: 44px 흰색 바 바로 아래 36px stone-50 바. border-b stone-200과 border-b stone-100의 차이는 실질적으로 구분 불가.
- **StepIndicator 화살표 터치영역 28px**: ChevronLeft/Right 4x4 + p-1.5 = ~28px. Apple HIG 최소 44px에 한참 못 미침.
- **BottomNav 라벨 text-[10px]**: 한글 획 밀도가 높아서 10px에서 가독성 심각하게 떨어짐.

### FE 관점

- **StepIndicator 조건부 렌더링 → 레이아웃 시프트**: 그룹에 탭이 1개면 숨겨지면서 36px 점프 발생.
- **데스크톱 탭 fallback import**: 모바일 번들에 데스크톱 전용 무거운 컴포넌트가 포함됨.

---

## 2. 화면 공간 부족

### 크롬(Chrome) 점유율

| 요소 | 높이 |
|------|------|
| iOS 상태바 | ~54px |
| TopBar | 44px |
| StepIndicator | 36px (조건부) |
| BottomNav | 64px |
| safe-area-bottom | ~34px |
| 콘텐츠 padding (py-4 상하) | 32px |
| **합계** | **264px** |

- iPhone SE (667px): 콘텐츠 영역 **403px** (60%)
- iPhone 15 (852px): 콘텐츠 영역 **588px** (69%)
- **키보드 올라올 때** (~260px): iPhone SE에서 **143px만** 남음. 텍스트 입력이 주 작업인 에디터에서 치명적.

### pb-24 이중 보상

BottomNav가 `fixed`인데 콘텐츠에 `pb-24`(96px) 추가. BottomNav(64px) + 32px 빈 공간이 생겨 "아래에 뭔가 더 있나?" 착각 유발.

---

## 3. 기타 문제

### 저장 상태 표시

- 현재: emerald-500 dot 2x2 (8px). 저장 완료인지, 뭔지 알 수 없음.
- 개선: "저장됨" / "저장 중..." 텍스트 (노션, 구글 독스 패턴)

### 발행 버튼 위치

- TopBar 우측에 text-xs 크기로 "발행" 버튼. 고위험 액션이 너무 가볍게 노출.
- 미완성 상태에서도 활성화되어 실수 발행 위험.

### PreviewFAB

- 핑크 원형 버튼에 Eye 아이콘만. 레이블 없어서 역할 불명확.
- BottomNav도 pink-500이라 시각적 계층 충돌.
- 콘텐츠 하단 입력 필드를 가릴 수 있음.

### 진행률 표시

- 그룹 전체 완료 시에만 초록 체크. 4개 탭 중 3개 완료해도 아무 표시 없음.
- 부분 진행률 표시 없어서 진행감 부재.

### iOS Safari 대응

- `h-screen`(100vh)은 iOS Safari에서 주소창 포함 높이라 하단 잘림. `h-[100dvh]` 필요.
- `env(safe-area-inset-bottom)` 작동하려면 `viewport-fit=cover` 메타 태그 필요.

---

## 4. 레이아웃 대안

### 대안 A: 단일 레벨 스크롤 탭 (추천)

토스/네이버 패턴. 구현 난이도 낮고 효과 최대.

```
┌─────────────────────────┐
│ ←  청첩장 편집   저장됨  발행│  TopBar 44px
├─────────────────────────┤
│ [템플릿][기본정보][예식장]   │  가로 스크롤 탭 40px
│ [인사말][갤러리][계좌][RSVP] │  (한 줄, 스크롤 가능)
│  ───── active underline  │  active: layoutId 애니메이션
├─────────────────────────┤
│                         │
│    콘텐츠 편집 영역        │  전체 남은 영역
│    (탭별 폼)             │  overflow-y-auto
│                         │
│                         │
│          [👁 미리보기]    │  하단 pill FAB
└─────────────────────────┘
```

- **BottomNav 제거**, 모든 탭을 한 줄 가로 스크롤로.
- 2단계 → 1단계. 8개 탭 전부 보여서 발견성 문제 해결.
- 크롬: TopBar(44px) + 탭(40px) = **84px**. 기존 144px 대비 60px 절약.
- 키보드 올라올 때 탭바 숨기면 44px만 남음.
- 잘려 보이는 오른쪽 탭이 "더 있다"는 힌트가 됨.

### 대안 B: 리니어 위저드 + 진행률 바

당근마켓 글쓰기 패턴. 첫 작성에 최적.

```
┌─────────────────────────┐
│ ×  청첩장 편집             │  TopBar 44px
├─────────────────────────┤
│ ████████░░░░░░░░  4/8   │  ProgressBar 8px
├─────────────────────────┤
│                         │
│  인사말을 작성해주세요      │  단계 제목
│                         │
│  ┌───────────────────┐  │
│  │   텍스트 입력 영역   │  │
│  └───────────────────┘  │
│                         │
├─────────────────────────┤
│  [이전]          [다음 →] │  Footer 56px
└─────────────────────────┘
```

- 순차적 위저드. 크롬 108px (가장 적음).
- 진행률 바로 전체 진행도 한눈에 파악.
- 청첩장 "한 번 만들고 끝" 특성에 적합.
- 단점: 수정 시 특정 항목으로 점프 불편 (진행률 바 탭 → 목록 바텀시트로 해결 가능).

### 대안 C: 섹션 카드 홈 + 드릴다운

카카오톡 프로필 편집 패턴. 전체 현황 파악에 최적.

```
┌─────────────────────────┐
│ ←  청첩장 편집   저장됨  발행│  TopBar 44px
├─────────────────────────┤
│  ┌───────────────────┐  │
│  │ 디자인        ✓완료 │  │  탭하면 편집 화면으로 push
│  │ 클래식 · 핑크 테마  │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ 신랑 · 신부   2/4  │  │
│  │ 이름, 연락처       │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ 예식 정보     미입력 │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ 콘텐츠       1/4  │  │
│  └───────────────────┘  │
│         [미리보기]       │
└─────────────────────────┘
```

- 홈에서 전체 섹션 개요 + 완료 상태 표시.
- 드릴다운 내에서 가로 탭으로 하위 항목 이동.
- 단점: 홈 ↔ 편집 이동이 한 단계 더.

### 하이브리드 추천

대안 B(위저드)를 **첫 작성 플로우**로, 대안 A(스크롤 탭)를 **수정 모드**로 조합하면 최적. 다만 리소스 제한적이면 **대안 A만으로도 현재 대비 극적인 개선**.

---

## 5. Quick Wins (즉시 적용 가능)

레이아웃 방향과 무관하게 바로 적용할 수 있는 개선들.

### 5-1. 저장 상태 텍스트화

```tsx
// 현재
<div className="w-2 h-2 bg-emerald-500 rounded-full" />

// 개선
{isSaving ? (
  <span className="text-xs text-stone-400">저장 중...</span>
) : lastSaved ? (
  <span className="text-xs text-emerald-600">저장됨</span>
) : null}
```

### 5-2. FAB에 라벨 추가 (pill shape)

```tsx
// 현재: 원형 아이콘만
<button className="w-12 h-12 rounded-full bg-pink-500">
  <Eye className="w-5 h-5" />
</button>

// 개선: pill + 라벨
<button className="flex items-center gap-1.5 px-4 h-11
  rounded-full bg-pink-500 shadow-lg shadow-pink-500/25
  text-white text-sm font-medium">
  <Eye className="w-4 h-4" />
  미리보기
</button>
```

### 5-3. h-screen → h-[100dvh]

```tsx
// 현재
<div className="h-screen flex flex-col">

// 개선 (iOS Safari 주소창 대응)
<div className="h-screen h-[100dvh] flex flex-col">
// h-screen은 dvh 미지원 브라우저 폴백
```

### 5-4. 콘텐츠 배경색 대비 강화

```tsx
// 현재: 흰색과 거의 구분 안 됨
<div className="bg-stone-50/50">

// 개선: 카드와의 대비 확보
<div className="bg-stone-100/60">
```

### 5-5. 미리보기 오버레이에 slide-up 트랜지션

```tsx
// 현재: 즉시 표시/숨김
if (!isOpen) return null;
return <div className="fixed inset-0 z-50">...</div>;

// 개선: Framer Motion slide-up
<AnimatePresence>
  {isOpen && (
    <motion.div
      className="fixed inset-0 z-50 bg-white"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
    >
      {/* 오버레이 콘텐츠 */}
    </motion.div>
  )}
</AnimatePresence>
```

### 5-6. viewport-fit=cover 확인

```tsx
// app/layout.tsx에 있어야 함
export const viewport: Viewport = {
  viewportFit: 'cover',
};
```

없으면 `env(safe-area-inset-bottom)`이 항상 0.

---

## 6. 기술 구현 가이드 (대안 A 기준)

### 컴포넌트 트리

```
MobileEditorPage
├── h-[100dvh] flex flex-col
│
├── MobileTopBar (shrink-0, 44px + safe-area-top)
│   ├── ← 뒤로가기
│   ├── 청첩장 제목
│   └── 저장됨 텍스트 + 발행 버튼
│
├── MobileTabBar (shrink-0, ~44px, 가로 스크롤)
│   ├── 탭 아이템들 (overflow-x-auto, snap-x, scrollbar-hide)
│   └── ActiveIndicator (motion.div, layoutId="tab-underline")
│
├── TabContent (flex-1, overflow-hidden)
│   └── AnimatePresence mode="popLayout"
│       └── motion.div (key=activeTab, slide-left/right)
│           └── overflow-y-auto, px-4 py-4
│               └── <TabComponent />
│
├── MobilePreviewFAB (sticky bottom-4, pill shape)
│
└── AnimatePresence
    └── MobilePreviewOverlay (slide-up, spring)
```

### 탭바 구현

```tsx
function MobileTabBar() {
  const { activeTab, setActiveTab } = useInvitationEditor();
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={scrollRef}
      className="flex items-center gap-1 overflow-x-auto scrollbar-hide
                 border-b border-stone-200 px-4 shrink-0"
    >
      {EDITOR_TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className="relative shrink-0 px-3 py-2.5 text-sm whitespace-nowrap
                     transition-colors"
        >
          <span className={activeTab === tab.id ? 'text-stone-900 font-medium' : 'text-stone-400'}>
            {tab.label}
          </span>
          {activeTab === tab.id && (
            <motion.div
              layoutId="tab-underline"
              className="absolute bottom-0 inset-x-1 h-0.5 bg-stone-900 rounded-full"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
```

### 탭 전환 애니메이션

```tsx
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '30%' : '-30%',
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? '-30%' : '30%',
    opacity: 0,
  }),
};

// direction은 이전/현재 탭 인덱스 비교로 결정
<AnimatePresence mode="popLayout" custom={direction} initial={false}>
  <motion.div
    key={activeTab}
    custom={direction}
    variants={slideVariants}
    initial="enter"
    animate="center"
    exit="exit"
    transition={{ type: 'tween', duration: 0.2, ease: 'easeInOut' }}
    className="h-full overflow-y-auto px-4 py-4"
  >
    <TabContent />
  </motion.div>
</AnimatePresence>
```

### 데스크톱 폴백 탭 코드 스플리팅

```tsx
import dynamic from 'next/dynamic';

const desktopFallbacks: Record<string, React.ComponentType> = {
  template: dynamic(() => import('@/components/editor/tabs/TemplateTab').then(m => m.TemplateTab), { ssr: false }),
  basic: dynamic(() => import('@/components/editor/tabs/BasicInfoTab').then(m => m.BasicInfoTab), { ssr: false }),
  // ...
};
```

### 주의사항

- `AnimatePresence` + `overflow-hidden`: exit 애니메이션 잘림 방지를 위해 `mode="popLayout"` 사용
- `will-change: transform` 남용 금지. Framer Motion이 자동 처리.
- Zustand 스토어 변경 불필요. 레이아웃은 순수 UI 계층.
- `100dvh` 지원: iOS 15.4+, Android Chrome 108+. 한국 모바일 사용자 거의 커버.

---

## 7. 우선순위 정리

### Phase 1: 즉시 (Quick Wins)

| # | 항목 | 난이도 | 영향 |
|---|------|--------|------|
| 1 | h-screen → h-[100dvh] | 매우 낮음 | iOS 하단 잘림 해결 |
| 2 | 저장 상태 텍스트화 | 매우 낮음 | 사용자 안심감 |
| 3 | FAB pill shape + 라벨 | 낮음 | 기능 발견성 |
| 4 | 미리보기 slide-up 트랜지션 | 낮음 | 체감 품질 |
| 5 | 배경색 대비 강화 | 매우 낮음 | 시각 계층 |
| 6 | viewport-fit=cover 확인 | 매우 낮음 | safe-area 작동 |

### Phase 2: 핵심 (레이아웃 변경)

| # | 항목 | 난이도 | 영향 |
|---|------|--------|------|
| 7 | BottomNav → 가로 스크롤 탭바 | 중간 | **근본 문제 해결** |
| 8 | StepIndicator 제거 | 낮음 | 레이아웃 시프트 해결 |
| 9 | BottomNav fixed → flex 레이아웃 | 낮음 | pb-24 제거 |
| 10 | 탭 전환 AnimatePresence | 중간 | 네이티브 느낌 |

### Phase 3: 완성도

| # | 항목 | 난이도 | 영향 |
|---|------|--------|------|
| 11 | 데스크톱 폴백 탭 dynamic import | 낮음 | 번들 사이즈 |
| 12 | 키보드 올라올 때 탭바 자동 숨김 | 중간 | 입력 영역 확보 |
| 13 | 바텀시트 컴포넌트 (미리보기 등) | 높음 | 모바일 UX |
| 14 | 발행 버튼 완성도 게이트 | 중간 | 실수 발행 방지 |
