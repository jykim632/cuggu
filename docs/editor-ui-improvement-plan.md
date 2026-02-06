# Editor UI 개선: 사이드바 → 섹션 패널 + 섹션 토글

## Context

현재 에디터는 64px 아이콘 전용 사이드바(Figma 스타일)를 사용 중. 청첩장 편집 사용자에게는 과한 미니멀리즘으로, 아이콘만으로 뭔지 파악하기 어렵고 섹션 활성화/비활성화 기능이 없음. 사이드바를 넓은 섹션 패널(~220px)로 교체하고, 선택 섹션(인사말/갤러리/계좌)에 토글 기능을 추가.

## 현재 구조

```
┌──────────────────────────────────────────────────────┐
│                    TopBar (56px)                      │
├──────┬──────────────────────────┬────────────────────┤
│      │                          │                    │
│ Side │    EditorPanel            │   PreviewPanel     │
│ bar  │    (Form Area)            │   (Live Preview)   │
│      │                          │                    │
│ 64px │    max-w-3xl              │     420px          │
│ icon │                          │                    │
│ only │                          │                    │
└──────┴──────────────────────────┴────────────────────┘
```

- **사이드바**: 64px, 아이콘만, 호버 시 툴팁
- **7개 탭**: 템플릿, 기본정보(필수), 예식장(필수), 인사말, 갤러리, 계좌, 설정
- **StepNavigation**: 상단 "1/7 템플릿" + 하단 이전/다음 버튼
- **상태관리**: Zustand (`stores/invitation-editor.ts`)
- **자동저장**: `updateInvitation()` 호출 후 2초 디바운스

## 변경 후 구조

```
┌──────────────────────────────────────────────────────┐
│                    TopBar (56px)                      │
├────────────────┬─────────────────┬───────────────────┤
│                │                 │                   │
│  SectionPanel  │  EditorPanel    │  PreviewPanel     │
│  (~220px)      │  (flex-1)       │  (420px)          │
│                │                 │                   │
│  아이콘+텍스트  │                 │                   │
│  설명문        │                 │                   │
│  토글 스위치   │                 │                   │
│                │                 │                   │
└────────────────┴─────────────────┴───────────────────┘
```

## 섹션 패널 디자인

```
┌──────────────────────┐
│  📋 템플릿            │  ← group: template
│     청첩장 디자인 선택  │
├──────────────────────┤
│  필수                 │  ← group label (uppercase, stone-400)
│  👤 기본 정보     ✓   │  ← 완료 뱃지
│     신랑·신부 정보     │  ← description (12px, stone-500)
│  📍 예식장        ⚠   │  ← 미완료 뱃지 (required만)
│     날짜·장소·오시는길  │
├──────────────────────┤
│  선택                 │  ← group label
│  💬 인사말      [🔘]  │  ← toggle switch
│     하객들께 전하는 메시지│
│  🖼 갤러리      [🔘]  │
│     사진 업로드 및 관리 │
│  💳 계좌        [🔘]  │
│     축의금 계좌 안내   │
├──────────────────────┤
│  ⚙ 설정              │  ← group: settings (mt-auto, 하단 고정)
│     추가 옵션         │
└──────────────────────┘
```

**스타일링:**
- 배경: `bg-stone-50`, 우측 보더
- 활성 탭: `bg-white` + 좌측 `border-l-2 border-pink-400`
- 아이콘(20px) + 라벨(14px font-medium) + 설명(12px text-stone-500)
- 완료 뱃지: 기존 Sidebar 로직 재사용
- 토글 off 항목: `opacity-50`, 클릭 시에도 해당 탭으로 이동 가능 (데이터 보존)
- 토글 UI: Tailwind로 직접 구현 (shadcn 의존성 없이)

## 변경 파일 목록

| # | 파일 | 변경 내용 |
|---|------|----------|
| 1 | `lib/editor/tabs.ts` | `description`, `toggleable`, `group` 필드 추가 |
| 2 | `stores/invitation-editor.ts` | `toggleSection` 액션 추가 |
| 3 | `schemas/invitation.ts` | `ExtendedDataSchema`에 `enabledSections` 추가 |
| 4 | `components/editor/SectionPanel.tsx` | **신규** - Sidebar 대체 컴포넌트 |
| 5 | `components/editor/StepNavigation.tsx` | 비활성 섹션 스킵 로직 |
| 6 | `components/templates/BaseTemplate.tsx` | `enabledSections` 반영하여 섹션 숨김 |
| 7 | `app/editor/[id]/page.tsx` | `Sidebar` → `SectionPanel` 교체 |

## 구현 상세

### 1. `lib/editor/tabs.ts` - 탭 메타데이터 확장

```typescript
export interface EditorTab {
  id: string;
  label: string;
  description: string;     // 섹션 설명 (서브텍스트)
  icon: LucideIcon;
  required?: boolean;
  toggleable?: boolean;    // true면 on/off 가능
  group: 'template' | 'required' | 'optional' | 'settings';
}

export const EDITOR_TABS: EditorTab[] = [
  { id: 'template', label: '템플릿', description: '청첩장 디자인 선택', icon: LayoutTemplate, group: 'template' },
  { id: 'basic', label: '기본 정보', description: '신랑·신부 정보와 가족 설정', icon: Users, required: true, group: 'required' },
  { id: 'venue', label: '예식장', description: '날짜·장소·오시는 길', icon: MapPin, required: true, group: 'required' },
  { id: 'greeting', label: '인사말', description: '하객들께 전하는 메시지', icon: MessageSquare, toggleable: true, group: 'optional' },
  { id: 'gallery', label: '갤러리', description: '사진 업로드 및 관리', icon: Images, toggleable: true, group: 'optional' },
  { id: 'account', label: '계좌', description: '축의금 계좌 안내', icon: CreditCard, toggleable: true, group: 'optional' },
  { id: 'settings', label: '설정', description: '추가 옵션 및 공개 설정', icon: Settings, group: 'settings' },
];
```

### 2. `stores/invitation-editor.ts` - 토글 액션

```typescript
// 인터페이스에 추가
toggleSection: (sectionId: string, enabled: boolean) => void;

// 구현
toggleSection: (sectionId, enabled) => {
  const current = get().invitation;
  const extendedData = (current.extendedData as Record<string, unknown>) || {};
  const enabledSections = (extendedData.enabledSections as Record<string, boolean>) || {
    greeting: true, gallery: true, account: true,
  };

  get().updateInvitation({
    extendedData: {
      ...extendedData,
      enabledSections: { ...enabledSections, [sectionId]: enabled },
    },
  });

  // 토글 off한 섹션이 현재 activeTab이면 다음 활성 탭으로 이동
  if (!enabled && get().activeTab === sectionId) {
    // 다음 활성 탭 찾기 로직
  }
},
```

### 3. `schemas/invitation.ts` - enabledSections 스키마

`ExtendedDataSchema`에 추가:
```typescript
enabledSections: z.object({
  greeting: z.boolean(),
  gallery: z.boolean(),
  account: z.boolean(),
}).optional(),
```

기본값은 코드 레벨에서 `{ greeting: true, gallery: true, account: true }` 처리.
기존 invitation에 이 필드가 없어도 전부 활성으로 동작 → DB 마이그레이션 불필요.

### 4. `components/editor/SectionPanel.tsx` - 신규 컴포넌트

Sidebar.tsx (64px 아이콘)를 대체하는 220px 섹션 패널. 기존 `Sidebar`의 `getTabStatus` 로직을 그대로 가져오고, 그룹핑 + 설명문 + 토글 스위치 추가.

### 5. `components/editor/StepNavigation.tsx` - 비활성 섹션 스킵

```typescript
// 기존: TAB_IDS 전체 사용
// 변경: enabledSections 기반 필터링
const enabledTabIds = TAB_IDS.filter(id => {
  const tab = EDITOR_TABS.find(t => t.id === id);
  if (!tab?.toggleable) return true;
  return enabledSections[id] !== false;
});
```

step counter, isFirst, isLast 모두 `enabledTabIds` 기준으로 변경.

### 6. `components/templates/BaseTemplate.tsx` - 섹션 렌더링 필터

```typescript
const enabledSections = data.extendedData?.enabledSections ?? {
  greeting: true, gallery: true, account: true,
};

const sections: Record<SectionId, () => ReactNode> = {
  greeting: () => {
    if (enabledSections.greeting === false) return null;
    return <GreetingSection data={data} theme={theme} />;
  },
  gallery: () => {
    if (enabledSections.gallery === false) return null;
    return <GallerySection ... />;
  },
  accounts: () => {
    if (enabledSections.account === false) return null;  // account→accounts 매핑
    return <AccountsSection data={data} theme={theme} />;
  },
  // parents, ceremony, map, rsvp는 변경 없음
};
```

기존 `.filter(({ node }) => node !== null)` 로직이 자연스럽게 빈 섹션 제거.

### 7. `app/editor/[id]/page.tsx` - 컴포넌트 교체

```diff
- import { Sidebar } from '@/components/editor/Sidebar';
+ import { SectionPanel } from '@/components/editor/SectionPanel';

- <Sidebar activeTab={activeTab} invitation={invitation} />
+ <SectionPanel activeTab={activeTab} invitation={invitation} />
```

## 데이터 흐름

```
사용자가 토글 클릭
  → SectionPanel.toggleSection(sectionId, enabled)
  → store.updateInvitation({ extendedData: { enabledSections: {...} } })
  → 2초 후 auto-save → PUT /api/invitations/:id
  → StepNavigation이 enabledTabIds 재계산
  → BaseTemplate이 섹션 렌더링 필터링
  → PreviewPanel 실시간 반영
```

## 엣지 케이스

| 케이스 | 처리 |
|--------|------|
| 토글 off 상태에서 콘텐츠 보존 | 미리보기에서만 숨기고, 에디터에서는 접근 가능. 다시 켜면 기존 데이터 그대로 노출 |
| 기존 invitation (enabledSections 없음) | 전부 true로 처리. DB 마이그레이션 없음 |
| account ↔ accounts 네이밍 | 탭 ID는 `account`, BaseTemplate sectionId는 `accounts`. 매핑 시 주의 |
| 토글 off 중인 탭이 activeTab일 때 | 다음 활성 탭으로 자동 이동 |
| 모든 선택 섹션을 끈 경우 | 문제 없음. 필수 섹션만 남음 |

## 구현 순서

1. `lib/editor/tabs.ts` (메타데이터)
2. `schemas/invitation.ts` (스키마)
3. `stores/invitation-editor.ts` (스토어)
4. `components/editor/SectionPanel.tsx` (신규 UI)
5. `components/editor/StepNavigation.tsx` (필터링)
6. `components/templates/BaseTemplate.tsx` (렌더링)
7. `app/editor/[id]/page.tsx` (교체)

## 검증 체크리스트

- [ ] 에디터 페이지 로드 → 섹션 패널 정상 렌더
- [ ] 각 섹션 클릭 → 편집 영역 전환
- [ ] 완료 뱃지 정상 표시
- [ ] 선택 섹션 토글 off → 미리보기에서 해당 영역 사라짐
- [ ] 토글 off → StepNavigation이 해당 탭 스킵
- [ ] 토글 off → step counter 업데이트 (예: 5/7 → 5/5)
- [ ] 페이지 새로고침 → 토글 상태 유지 (auto-save)
- [ ] 기존 invitation 로드 → 모든 섹션 기본 활성
- [ ] 토글 off 후 다시 on → 기존 데이터 보존
