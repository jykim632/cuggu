# 에디터 데스크톱/모바일 라우트 분리

## Context

기존 접근: 하나의 에디터 페이지에서 Tailwind 반응형 클래스로 360~390px까지 커버하려 함 → 탭마다 세부 땜질 필요, 양쪽 다 어중간해짐.

새 접근: **라우트 자체를 분리**. `/editor/[id]`(데스크톱), `/m/editor/[id]`(모바일). 서버에서 UA 감지 후 리다이렉트. 각 라우트는 자기 뷰포트만 신경 쓰면 됨.

`feature/mobile-editor-responsive` 브랜치(worktree: `cuggu-mobile-editor/`)에 이미 모바일 전용 컴포넌트 3개 구현되어 있음 → 가져와서 사용.

---

## 아키텍처

```
/editor/[id] (데스크톱 ≥1024px)
┌──────────────────────────────────────────────────┐
│ TopBar                                            │
├──────────┬────────────────────┬──────────────────┤
│ Section  │ EditorPanel        │ PreviewPanel     │
│ Panel    │ (탭 컴포넌트 공유)  │ (420px)          │
│ (220px)  │                    │                  │
└──────────┴────────────────────┴──────────────────┘

/m/editor/[id] (모바일 <768px)
┌──────────────────┐
│ MobileTopBar     │
├──────────────────┤
│                  │
│ MobileEditorPanel│   + PreviewFAB (플로팅)
│ (탭 컴포넌트 공유) │
│                  │
├──────────────────┤
│ MobileBottomNav  │
└──────────────────┘

/m/editor/[id] (태블릿 768~1023px)
┌────────────────────────────────┐
│ MobileTopBar                   │
├────────────────────────────────┤
│ TabletTabStrip                 │
├─────────────────┬──────────────┤
│ MobileEditor    │ PreviewPanel │
│ Panel           │              │
└─────────────────┴──────────────┘
```

---

## 공유 vs 분리

| 구분 | 공유 | 비고 |
|------|------|------|
| **탭 컴포넌트** (14개) | ✅ 공유 | TemplateTab, BasicInfoTab 등 모든 폼 로직 동일 |
| **Zustand store** | ✅ 공유 | `stores/invitation-editor.ts` |
| **lib/editor/tabs.ts** | ✅ 공유 | 탭 정의, 그룹핑 |
| **API routes** | ✅ 공유 | 에디터 데이터 로드/저장 |
| **SectionPanel** | 🖥️ 데스크톱 전용 | 좌측 사이드바 |
| **PreviewPanel** | 🖥️ 데스크톱+태블릿 | 우측 실시간 미리보기 |
| **MobileBottomNav** | 📱 모바일 전용 | 하단 4그룹 탭바 |
| **MobilePreviewOverlay/FAB** | 📱 모바일 전용 | 전체화면 미리보기 + 플로팅 버튼 |
| **TabletTabStrip** | 📱 태블릿 전용 | 상단 수평 탭 스트립 |

---

## 파일 변경 목록

### 새로 생성 (5개)

| 파일 | 소스 | 설명 |
|------|------|------|
| `app/m/editor/[id]/page.tsx` | worktree 기반 | 모바일/태블릿 에디터 페이지 |
| `app/m/editor/[id]/layout.tsx` | 데스크톱과 동일 | ToastProvider + h-screen |
| `components/editor/MobileBottomNav.tsx` | worktree 복사 | 하단 탭 네비게이션 |
| `components/editor/MobilePreviewOverlay.tsx` | worktree 복사 | 전체화면 미리보기 + FAB |
| `hooks/use-media-query.ts` | worktree 복사 | SSR-safe breakpoint 훅 |

### 수정 (3개)

| 파일 | 변경 내용 |
|------|-----------|
| `proxy.ts` | UA 감지 로직 추가: 모바일 UA → `/m/editor/[id]` 리다이렉트, 데스크톱 UA → `/editor/[id]` 리다이렉트. `/m/editor` 보호 라우트 추가 |
| `components/editor/TopBar.tsx` | 모바일 반응형 클래스 추가 (px-3 md:px-6, hidden md:inline 등) — worktree diff 적용 |
| `components/editor/EditorPanel.tsx` | 모바일 패딩 반응형 (px-4 md:px-8, pb-20 md:pb-0) — worktree diff 적용 |

### 변경 없음

| 파일 | 이유 |
|------|------|
| `app/editor/[id]/page.tsx` | 데스크톱 전용 → 현재 코드 그대로 |
| `components/editor/SectionPanel.tsx` | 데스크톱 전용 → 변경 불필요 |
| `components/editor/PreviewPanel.tsx` | 데스크톱+태블릿 → 변경 불필요 |
| `components/editor/tabs/*.tsx` (14개) | 폼 로직 공유 → 변경 불필요 |

---

## 상세 구현

### 1. proxy.ts 수정 (기존 미들웨어에 UA 리다이렉트 추가)

기존 `proxy.ts`는 NextAuth `auth()` 래핑 미들웨어로 인증 + rate limiting + 라우트 보호를 처리 중.
여기에 에디터 UA 리다이렉트 로직을 추가한다.

**변경 사항:**

```typescript
// proxy.ts — 추가할 부분

const MOBILE_UA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

export default auth(async (req) => {
  const { nextUrl } = req;

  // ... 기존 rate limiting 로직 ...

  // ── 에디터 UA 리다이렉트 (인증 체크 전에 실행) ──
  const ua = req.headers.get('user-agent') || '';
  const isMobileUA = MOBILE_UA.test(ua);
  const preferDesktop = req.cookies.get('prefer-desktop-editor')?.value === 'true';

  // 데스크톱 에디터 라우트에 모바일 접속 → /m/editor로
  if (nextUrl.pathname.startsWith('/editor/') && isMobileUA && !preferDesktop) {
    const mobileUrl = nextUrl.clone();
    mobileUrl.pathname = nextUrl.pathname.replace('/editor/', '/m/editor/');
    return NextResponse.redirect(mobileUrl);
  }

  // 모바일 에디터 라우트에 데스크톱 접속 → /editor로
  if (nextUrl.pathname.startsWith('/m/editor/') && !isMobileUA) {
    const desktopUrl = nextUrl.clone();
    desktopUrl.pathname = nextUrl.pathname.replace('/m/editor/', '/editor/');
    return NextResponse.redirect(desktopUrl);
  }

  // ── 기존 인증 로직 ──
  const isLoggedIn = !!req.auth;

  const isProtectedRoute =
    nextUrl.pathname.startsWith("/dashboard") ||
    nextUrl.pathname.startsWith("/editor") ||
    nextUrl.pathname.startsWith("/m/editor") ||  // ← 추가
    nextUrl.pathname.startsWith("/settings");

  // ... 나머지 기존 로직 ...
});
```

**핵심 포인트:**
- 새 파일 생성 없이 기존 `proxy.ts`에 통합
- UA 리다이렉트는 인증 체크보다 먼저 실행 (리다이렉트 후 인증은 도착지에서 처리)
- `/m/editor`도 보호 라우트에 추가하여 미인증 접근 차단
- `prefer-desktop-editor` 쿠키로 수동 전환 허용

### 2. 모바일 에디터 페이지 (`app/m/editor/[id]/page.tsx`)

worktree의 page.tsx 기반. `useBreakpoint`로 모바일/태블릿 분기:
- 모바일(<768): 1패널 + BottomNav + PreviewFAB
- 태블릿(768~1023): TabletTabStrip + 2패널(Editor+Preview)

### 3. 모바일 컴포넌트 (worktree에서 복사)

- `MobileBottomNav`: 4개 그룹(디자인/정보/콘텐츠/설정), 완성도 뱃지
- `MobilePreviewOverlay`: 전체화면 미리보기 + X 닫기
- `MobilePreviewFAB`: 우하단 핑크 플로팅 Eye 버튼
- `TabletTabStrip`은 필요 시 별도 추가 (태블릿 지원 범위에 따라)

### 4. TopBar 수정 (worktree diff 적용)

주요 변경:
- 모바일에서 텍스트 숨김: `hidden md:inline` (대시보드, 저장 중, 발행하기)
- 패딩 축소: `px-6` → `px-3 md:px-6`
- AI 크레딧 모바일 숨김: `hidden md:flex`
- 미리보기 버튼 모바일 숨김: `hidden md:flex` (FAB로 대체)

### 5. EditorPanel 수정 (worktree diff 적용)

- 패딩: `px-8 py-6` → `px-4 py-4 md:px-8 md:py-6`
- 하단 여백: `pb-20 md:pb-0` (MobileBottomNav 높이 확보)

---

## 구현 순서

1. `hooks/use-media-query.ts` 생성
2. 모바일 전용 컴포넌트 3개 생성 (MobileBottomNav, MobilePreviewOverlay, TabletTabStrip)
3. `TopBar.tsx`, `EditorPanel.tsx` 수정
4. `app/m/editor/[id]/layout.tsx` + `page.tsx` 생성
5. `proxy.ts` 수정 (UA 리다이렉트 + `/m/editor` 보호 라우트 추가)
6. 타입 체크 + 동작 확인

---

## 검증

1. `npx tsc --noEmit` — 타입 에러 없음
2. 데스크톱 브라우저 → `/editor/[id]` 접속 → 3패널 정상 (기존과 동일)
3. Chrome DevTools 모바일 모드 → `/m/editor/[id]` 직접 접속:
   - MobileBottomNav 표시, 탭 전환 동작
   - PreviewFAB 클릭 → MobilePreviewOverlay 열림
   - 각 탭 폼 입력 정상
4. 모바일 UA로 `/editor/[id]` 접속 → `/m/editor/[id]`로 리다이렉트 확인
5. 데스크톱 UA로 `/m/editor/[id]` 접속 → `/editor/[id]`로 리다이렉트 확인
