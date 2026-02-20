# Cuggu 코드베이스 종합 분석 리포트

**날짜**: 2026-02-20
**분석 팀**: Backend 2명 + Frontend 3명 (AI 에이전트)
**범위**: 전체 코드베이스 — 코드 중복, 백엔드 효율성, 렌더링 성능, Hooks 감사, 모던 패턴 & UX

---

## 요약

| 카테고리 | 상태 |
|----------|------|
| 코드 중복 | NEEDS WORK — 인증 코드 50회+ 복붙, 상수/스키마 다중 정의 |
| 백엔드 로직 | GOOD — 크레딧 원자성 우수, 단 stream 라우트에 CRITICAL 논리 결함 |
| 렌더링 성능 | NEEDS OPTIMIZATION — Zustand 전체 구독, 애니메이션 재생성 |
| Hooks 사용 | GOOD with HIGH issues — 잘 설계된 훅 다수, 일부 추출 필요 |
| 모던 패턴/UX | NEEDS WORK — Server Components/Suspense 미활용, 에러 바운더리 부재 |

---

## CRITICAL (P0) — 즉시 수정

### 1. 에디터 로드 실패 시 fake 데이터로 자동저장 → 기존 데이터 손상 위험

**파일**: `app/editor/[id]/page.tsx:56-72`

API 실패 시 에러를 사용자에게 알리지 않고 빈 초기값(`userId: 'temp-user'`)으로 `setInvitation`을 호출한다. 이 경로에서 사용자가 편집을 계속하면 존재하지 않는 초대장을 저장하려다가 저장 실패가 발생하거나, 잘못된 데이터가 전송될 수 있다. 주석도 "임시"라고 명시돼 있으나 그대로 방치된 상태.

```tsx
// 현재 (위험)
} catch (error) {
  console.error('청첩장 로드 실패:', error);
  setInvitation({ id: id, userId: 'temp-user', ... }); // 잘못된 fallback
}

// 수정
} catch (error) {
  setLoadError('청첩장을 불러올 수 없습니다.');
  return;
}

// JSX에서
if (loadError) return <ErrorState message={loadError} onRetry={() => loadInvitation()} />;
```

---

### 2. console.log에 개인정보 노출

**파일**:
- `app/editor/[id]/page.tsx:49-51` — 초대장 전체 데이터 (이름, 연락처, 주소)
- `app/admin/layout.tsx:15,27` — 이메일, DB role

```tsx
// 삭제 또는 개발 환경 guard
if (process.env.NODE_ENV === 'development') {
  console.log('[Editor] loaded invitation:', result.data);
}
```

---

### 3. stream vs generate 라우트 크레딧 차감 순서 불일치

**파일**: `app/api/ai/generate/stream/route.ts` vs `app/api/ai/generate/route.ts`

두 라우트의 크레딧 차감 시점이 다르다:
- `generate/route.ts` (line 129): 크레딧 차감 → S3 업로드 → AI 생성
- `stream/route.ts` (line 202): S3 업로드 → 크레딧 차감 → AI 생성

stream 라우트에서 S3 실패 시 `creditsDeducted`는 항상 `false`이므로 환불 분기는 dead code. 현재는 크레딧 차감 전이라 실질적 피해는 없지만, 순서를 바꾸면 즉시 버그가 된다.

**수정**: stream 라우트의 크레딧 차감을 S3 업로드 이전으로 이동하여 두 라우트의 순서 일치.

---

### 4. Job 완료 처리 TOCTOU 레이스 컨디션

**파일**: `app/api/ai/generate/stream/route.ts:269-299`

```typescript
// UPDATE 후 별도 SELECT — 사이에 다른 요청이 끼어들 수 있음
await db.update(aiGenerationJobs).set({
    completedImages: sql`${aiGenerationJobs.completedImages} + 1`,
    ...
}).where(eq(aiGenerationJobs.id, jobId));

const updatedJob = await db.query.aiGenerationJobs.findFirst(...)
```

배치 생성(여러 이미지 동시 처리)에서 마지막 이미지를 처리하는 두 worker가 동시에 "완료 체크"를 통과해 `releaseCredits`가 두 번 호출될 수 있다.

**수정**: UPDATE와 완료 체크를 하나의 트랜잭션으로 묶어 `RETURNING`으로 처리하거나, 조건을 UPDATE의 WHERE절에 포함.

---

### 5. Zustand 스토어 타이머 누수

**파일**: `stores/invitation-editor.ts:46-47`

```ts
let autoSaveTimer: NodeJS.Timeout | null = null;
let retryTimer: NodeJS.Timeout | null = null;
```

모듈 스코프 타이머가 에디터 페이지 이탈 시 cleanup 되지 않음. `reset()`을 호출하지 않고 페이지를 이탈하면 타이머가 살아남아 언마운트된 컴포넌트를 대상으로 `get().save()`를 계속 호출.

```tsx
// app/editor/[id]/page.tsx 또는 EditorPanel에서
useEffect(() => {
  return () => useInvitationEditor.getState().reset();
}, []);
```

---

### 6. 얕은 병합(shallow merge)으로 중첩 객체 데이터 유실 가능

**파일**: `stores/invitation-editor.ts:75`

```ts
updateInvitation: (data) => {
  const updated = { ...get().invitation, ...data };
```

최상위만 스프레드. `updateInvitation({ wedding: { venue: { name: '...' } } })` 호출 시 `wedding.date` 사라짐. 현재 각 탭에서 방어적으로 처리하고 있으나 호출부마다 작성해야 하는 것 자체가 취약.

```ts
import merge from 'lodash/merge';
updateInvitation: (data) => {
  const updated = merge({}, get().invitation, data);
```

---

## HIGH (P1) — 우선 개선

### 7. Zustand selector 미사용 — 에디터 렌더링 폭발

**파일**: 에디터 탭 8개 전체 (BasicInfoTab, GalleryTab, GreetingTab, RsvpTab, AccountTab, VenueTab, SettingsTab, TemplateTab)

```tsx
// 현재 — 스토어 전체 구독
const { invitation, updateInvitation } = useInvitationEditor();

// 수정 — 필요한 슬라이스만 구독
const invitation = useInvitationEditor((s) => s.invitation);
const updateInvitation = useInvitationEditor((s) => s.updateInvitation);
```

**영향**: `isSaving`, `lastSaved`, `validationResult`, `activeTab` 등 어느 하나라도 바뀌면 모든 탭 컴포넌트가 리렌더링. 키 입력 1회당 최대 24번 불필요한 렌더링. selector 도입으로 80% 감소 가능.

---

### 8. 대시보드 전체 'use client' — Server Components 미활용

**파일**: `app/(dashboard)/dashboard/page.tsx`, `invitations/page.tsx`, `rsvp/page.tsx`, `settings/page.tsx` 등 16개 페이지

모든 대시보드 페이지가 `"use client"` + `useEffect` + `fetch` 패턴. 초기 HTML이 빈 로딩 스피너이므로 LCP 나쁨.

```tsx
// 현재
"use client"
export default function DashboardPage() {
  const [stats, setStats] = useState(...);
  useEffect(() => { fetch(...) }, []);
  if (isLoading) return <Spinner />;
}

// 개선: 서버 컴포넌트
export default async function DashboardPage() {
  const [stats, invitations] = await Promise.all([
    fetchStats(), fetchInvitations(),
  ]);
  return <DashboardClient stats={stats} invitations={invitations} />;
}
```

---

### 9. loading.tsx / error.tsx / not-found.tsx 전무

**파일**: `app/` 전체 (공개 청첩장 `app/inv/[id]/`에서만 `notFound()` 직접 호출)

프로젝트 전체에 `loading.tsx`, `error.tsx`, `not-found.tsx` 파일 0개. 최소 필요:
- `app/(dashboard)/loading.tsx`
- `app/(dashboard)/error.tsx`
- `app/editor/[id]/loading.tsx`
- `app/admin/loading.tsx`, `app/admin/error.tsx`

`error.tsx` 없으면 서버 컴포넌트 예외 시 루트 레이아웃까지 버블업 → 전체 앱 크래시.

---

### 10. alert() 8곳+ 사용

**파일**:
- `app/(dashboard)/invitations/page.tsx:82, 84, 95`
- `app/(dashboard)/settings/page.tsx:63, 67`
- `app/admin/users/page.tsx:67, 93`
- `app/admin/settings/page.tsx:78`
- `components/admin/EmptyState.tsx:49`
- `components/editor/InvitationCard.tsx:71, 103`

Toast 시스템(`components/ui/Toast.tsx`, `useToast` 훅)이 이미 존재. 전부 `useToast()`로 교체.

---

### 11. invitation: any 타입 7개 파일

**파일**: `EditorPanel.tsx:15`, `Sidebar.tsx:9`, `TopBar.tsx:13`, `SectionPanel`, `TabletTabStrip`, `MobilePreviewOverlay`, `PreviewPanel`

모두 `invitation: any` + `// TODO: Invitation 타입` 주석. `@/schemas/invitation`에 타입이 이미 존재.

```tsx
import type { Invitation } from '@/schemas/invitation';
interface EditorPanelProps {
  activeTab: string;
  invitation: Invitation;
}
```

---

### 12. requireAuthUser 미활용 — 인증 코드 50회+ 복붙

**파일**: `app/api/ai/**/*.ts` 전체 (22개 파일)

`lib/api-utils.ts:206`에 `requireAuthUser()`가 있지만 AI route에서 전혀 사용하지 않음. 아래 블록이 50회 이상 복붙:

```typescript
const session = await auth();
if (!session?.user?.email) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
const user = await db.query.users.findFirst({
  where: eq(users.email, session.user.email),
  columns: { id: true },
});
if (!user) {
  return NextResponse.json({ error: 'User not found' }, { status: 404 });
}
```

추가 문제: AI route는 `session.user.email` → DB 조회, invitations route는 `session.user.id` 직접 사용. 인증 체계 이중화.

**수정**: `requireAuthUser()`에 email 기반 오버로드 추가 후 AI route 전체 적용.

---

### 13. FallingPetals 랜덤값 매 렌더마다 재생성

**파일**:
- `components/animations/FallingPetals.tsx:14-19`
- `components/landing/HeroImpact.tsx:138-143`

```tsx
// 현재 — 렌더링마다 새 랜덤값
const petals = Array.from({ length: 10 }, (_, i) => ({
  x: Math.random() * 100,
  delay: Math.random() * 5,
  duration: 8 + Math.random() * 4,
}));

// 수정
const petals = useMemo(() => Array.from({ length: 10 }, (_, i) => ({
  x: Math.random() * 100,
  delay: Math.random() * 5,
  duration: 8 + Math.random() * 4,
})), []);
```

---

### 14. TemplateTab JSON.stringify 비교

**파일**: `components/editor/tabs/TemplateTab.tsx:462-463`

```tsx
{savedThemes.map((theme) => {
  const isApplied = isCustomActive &&
    JSON.stringify(currentCustomTheme) === JSON.stringify(theme.theme);
})}
```

테마 N개일 때 렌더링마다 N+1번 직렬화. 에디터에서 키 입력마다 실행.

**수정**: 적용 시 테마 ID를 스토어에 저장, 비교는 ID로.

```tsx
const isApplied = isCustomActive && invitation.customThemeId === theme.id;
```

---

### 15. Publish 로직 TopBar/MobileTopBar 완전 중복

**파일**: `components/editor/TopBar.tsx:39-66`, `components/editor/mobile/MobileTopBar.tsx:31-58`

동일한 `fetch('/api/invitations/${id}', { method: 'PUT', body: { status: 'PUBLISHED' } })` 로직. `formatTimeAgo`도 `TopBar.tsx:74`와 `TemplateTab.tsx:165`에 각각 독립 구현.

**수정**: `hooks/usePublishInvitation.ts` 추출, `formatTimeAgo` → `lib/format.ts` 통합.

---

### 16. RSVPForm react-hook-form 미사용

**파일**: `components/rsvp/RSVPForm.tsx:43-51`

```tsx
const [guestName, setGuestName] = useState("");
const [guestPhone, setGuestPhone] = useState("");
const [attendance, setAttendance] = useState<AttendanceStatus>("ATTENDING");
const [guestCount, setGuestCount] = useState(1);
const [mealOption, setMealOption] = useState<MealOption>("ADULT");
const [message, setMessage] = useState("");
```

`react-hook-form + @hookform/resolvers + Zod`가 이미 설치됨. `schemas/rsvp`에 RSVP 스키마도 존재. 검증은 `guestName.trim()` 인라인 체크만.

```tsx
const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
  resolver: zodResolver(rsvpSchema),
  defaultValues: { attendance: 'ATTENDING', guestCount: 1, mealOption: 'ADULT' },
});
```

---

### 17. stream/route.ts 423줄 단일 함수

**파일**: `app/api/ai/generate/stream/route.ts`

인증, rate limiting, 파일 검증, 얼굴 감지, S3 업로드, 크레딧 관리, AI 생성, Job 상태 추적, DB 저장, SSE 전송이 하나의 함수에. `generate/route.ts`와 중복 로직(파일 검증, 얼굴 감지, S3 업로드, 크레딧 차감, DB 저장)이 그대로 복사됨.

**수정**: 공통 로직을 `lib/ai/generation-pipeline.ts`로 추출, stream 라우트는 SSE 전송만 담당.

---

### 18. 파일 검증 상수 5곳 산재 + MIME 타입 불일치

| 위치 | 내용 |
|------|------|
| `lib/ai/constants.ts:5,25` | `MAX_FILE_SIZE` 같은 파일 내 **2회** 정의 |
| `types/ai.ts:183,184` | `MAX_FILE_SIZE`, `ALLOWED_FILE_TYPES` 상수 |
| `schemas/common.ts:109,113` | ImageUploadSchema 내 검증 |
| `schemas/ai.ts:68,73` | GenerateAIPhotoRequestSchema 내 검증 |
| `schemas/ai.ts:137,143` | validateFileForUpload 함수 내 검증 |
| 컴포넌트 2곳 | 하드코딩 |

**심각**: gif 포함 여부가 위치마다 다름 — `['image/jpeg', 'image/png', 'image/webp']` vs `['image/jpeg', 'image/png', 'image/webp', 'image/gif']`

**수정**: `lib/ai/constants.ts`의 `MAX_FILE_SIZE`를 single source of truth로 통일. `ALLOWED_FILE_TYPES` canonical 배열 하나로.

---

### 19. 응답 포맷 이중화

Admin route 11개: `withErrorHandler` + `successResponse()` + `errorResponse()` 사용.
AI route 16개: 직접 `NextResponse.json({ error: '...' }, { status: 500 })` 사용.

성공 응답도 일부 `{ success: true, data }`, 일부 raw 객체 직접 반환.

**수정**: AI route에도 `withErrorHandler` 적용, 응답 포맷 통일.

---

## MEDIUM (P2) — 개선 권장

### 20. EditorPanel 탭 언마운트/리마운트 → API 중복 호출

**파일**: `components/editor/EditorPanel.tsx:24-49`

탭 전환마다 이전 탭 언마운트 → 새 탭 마운트. `TemplateTab`은 마운트 시 `fetchThemes()` API 호출.

수정 옵션:
- A. CSS `hidden`으로 숨기기 (상태 유지)
- B. SWR/React Query 사용 (dedup 자동)
- C. fetch 결과를 Zustand 스토어에 캐싱

---

### 21. TemplateTab God Component

**파일**: `components/editor/tabs/TemplateTab.tsx`

단일 파일에 너무 많은 책임: 템플릿 선택 UI, AI 테마 생성 (fetch + 상태), 저장된 테마 라이브러리 (fetch + 삭제), 컨텍스트 체크 모달, 미니 프리뷰 렌더러, 상대 시간 포맷 유틸.

**수정**: `useThemeLibrary` 훅으로 테마 라이브러리 fetch/delete 로직 분리.

---

### 22. generateBatch 213줄 + SSE 파싱 로직 중복

**파일**: `hooks/useAIGeneration.ts:141-353`

SSE 스트리밍 읽기 로직이 `generateSingle`(line 92-130)과 `generateBatch`(line 208-240)에서 거의 동일.

**수정**: SSE 스트리밍 처리를 별도 함수 `readSSEStream()` 추출.

---

### 23. RSVP 삭제 시 optimistic update + refetch 이중 처리

**파일**: `app/(dashboard)/rsvp/page.tsx:89-90`

```tsx
if (response.ok) {
  setRsvps((prev) => prev.filter((r) => r.id !== rsvpId)); // optimistic
  fetchRsvps(selectedId); // refetch가 optimistic을 덮어씀
}
```

둘 중 하나만 유지.

---

### 24. ai-photos 3뷰(card/list/gallery) 동일 로직 3벌

**파일**: `app/(dashboard)/ai-photos/page.tsx:149-287`

`thumbUrl` 추출, 날짜 포맷, 빈 상태 아이콘, "새 앨범 만들기" 버튼이 3개 블록에 거의 동일하게 반복.

**수정**: `AlbumItem` 컴포넌트 추출, viewMode를 prop으로 전달.

---

### 25. BasicInfoTab 신랑/신부 섹션 코드 중복

**파일**: `components/editor/BasicInfoTab.tsx:260-315`

신랑/신부 입력 블록(이름, 가족 표기, 부모 이름, 故 체크, 관계, 연락처)이 동일한 JSX 반복.

**수정**: `PersonSection` 컴포넌트 추출.

---

### 26. PersonSchema 중복 정의

**파일**: `schemas/invitation.ts`

`isDeceased` 인라인 스키마 + fatherName/motherName 블록이 4회 반복 (line 86-91, 165-170, 272-275, 287-290). `CreateInvitationSchema`에서 `PersonSchema.extend`를 안 씀.

```ts
const IsDeceasedSchema = z.object({
  father: z.boolean().optional(),
  mother: z.boolean().optional(),
}).optional();

// CreateInvitationSchema에서
groom: PersonSchema.extend({ account: AccountSchema.optional() }),
```

---

### 27. 이미지 다운로드 함수 4중 구현

| 위치 | 함수 |
|------|------|
| `lib/ai/providers/openai.ts:16` | `downloadImageAsBuffer()` |
| `lib/ai/providers/gemini.ts:22` | `downloadImageAsBase64()` |
| `lib/ai/s3.ts:92` | 인라인 fetch+arrayBuffer |
| `lib/ai/internal.ts:89` | 인라인 fetch+arrayBuffer |

**수정**: `lib/ai/image-utils.ts`에 `downloadImageAsBuffer(url)` 단일 함수 추출.

---

### 28. Redis del + DB update 비원자적

**파일**: `lib/invitation-cache.ts:130-135`

```typescript
await redis.del(viewKey);          // (1) Redis 삭제
await db.update(invitations)...    // (2) DB 업데이트
```

(1)과 (2) 사이에 프로세스 죽으면 50개 뷰 카운트 유실.

**수정**: DB flush 성공 후 Redis `del` 호출 순서로 변경.

---

### 29. localStorage SSR hydration mismatch

**파일**: `app/(dashboard)/ai-photos/page.tsx:31-36`

```tsx
const [viewMode, setViewMode] = useState<ViewMode>(() => {
  if (typeof window !== 'undefined') {
    return (localStorage.getItem('album-view-mode') as ViewMode) || 'card';
  }
  return 'card';
});
```

**수정**: `useEffect`에서 localStorage 읽기.

```tsx
const [viewMode, setViewMode] = useState<ViewMode>('card');
useEffect(() => {
  const saved = localStorage.getItem('album-view-mode') as ViewMode;
  if (saved) setViewMode(saved);
}, []);
```

---

### 30. 페이지네이션 스키마 중복 + 필드명 불일치

| 위치 | 필드명 |
|------|--------|
| `schemas/common.ts` (`PaginationQuerySchema`) | `pageSize` |
| `app/api/ai/generations/route.ts` | `limit` |
| `app/api/admin/ai-generations/route.ts` | `pageSize` |
| `app/api/admin/ai-themes/route.ts` | `pageSize` |
| `app/api/admin/credit-transactions/route.ts` | `pageSize` |

**수정**: `PaginationQuerySchema`를 extend해서 사용, 필드명 `pageSize`로 통일.

---

## LOW (P3) — 참고

### 31. useConfirm resolver → useRef 전환

**파일**: `hooks/useConfirm.ts:16-18`

`resolver`를 `useState`로 관리 → 변경마다 리렌더 유발. `useRef`가 더 적합.

### 32. Drizzle inArray 미사용

**파일**: `app/api/ai/albums/route.ts:107-113`

`sql.join`으로 직접 SQL IN 조합. `inArray()` 함수 존재.

### 33. admin/users conditions.reduce Drizzle 안티패턴

**파일**: `app/api/admin/users/route.ts:47,64`

`conditions.reduce((a,b) => sql\`${a} AND ${b}\`)` → `and(...conditions)` 교체.

### 34. creditsReserved - creditsUsed 음수 가능성 무탐지

**파일**: `app/api/ai/jobs/[id]/route.ts:153`, `stream/route.ts:291`

음수 시 경고 로그 필요.

### 35. invalidateInvitationCache await 없음

**파일**: `app/api/invitations/[id]/route.ts:186,270`

의도적 fire-and-forget인지 실수인지 불명확. 명시 필요.

### 36. templates.config가 text (다른 JSON 데이터는 jsonb)

**파일**: `db/schema.ts:158`

### 37. AI client 싱글턴 패턴 불일치

- `theme-providers/`: 모듈 싱글턴
- `providers/`: 매번 new

### 38. 랜딩 페이지 4벌 유지

`components/landing-a/`, `landing-b/`, `landing-c/`, `landing/`, `marketing/` — Hero/CTA 유사 컴포넌트 산재.

### 39. DDayWidget setInterval 드리프트 + 백그라운드 탭 낭비

**파일**: `components/templates/sections/DDayWidget.tsx:135`

Page Visibility API로 숨겨진 탭에서 중지 권장.

### 40. GallerySection index를 React key로 사용

**파일**: `components/templates/sections/GallerySection.tsx:51,70`

이미지 URL이 고유하므로 `key={image}`로 변경.

### 41. MapSection setInterval 폴링으로 카카오 SDK 로드 확인

**파일**: `components/templates/MapSection.tsx:53-64`

`script.onload` 이벤트 활용 권장.

### 42. replicateId deprecated 컬럼 잔존

**파일**: `db/schema.ts:271`

### 43. invitations 테이블 updatedAt 인덱스 없음

### 44. AI generate 배치 루프 직렬 실행

**파일**: `lib/ai/generate.ts:44-58`

`BATCH_SIZE=4`일 때 4개 이미지 순차 생성. 비스트리밍 버전은 `Promise.all` 병렬 처리 가능.

---

## 긍정적 평가

### 잘 된 부분

1. **청첩장 공개 페이지** (`app/inv/[id]/`) — 서버 컴포넌트, Redis 캐시(5분 TTL), HMAC 쿠키 인증, fire-and-forget 조회수 증가. 프로젝트 내 최고 아키텍처.

2. **템플릿 시스템** — `BaseTemplate` + 테마 주입 패턴. 6개 템플릿이 단 3줄 래퍼로 구현. Open/Closed Principle 교과서적 적용.

3. **크레딧 원자성** — `deductCredits`, `reserveCredits`, `refundCredits` 모두 `db.transaction` + SQL WHERE 조건으로 race condition 방지. 외부 서비스 실패 시 환불 패턴 일관적.

4. **자동저장 3중 안전망** — 2초 debounce + 최대 3회 재시도(지수 백오프) + localStorage 백업.

5. **`useImageDownload`** — worker pool(MAX_CONCURRENT=4), JSZip dynamic import, `URL.revokeObjectURL` cleanup 올바름.

6. **어드민 인가** — layout 레벨 서버사이드 DB 체크. 클라이언트 우회 불가.

7. **`useMediaQuery`/`useBreakpoint`** — SSR 안전 처리(`undefined` 초기값, `isDesktop: true` 기본값) + cleanup 정확.

8. **`useMultiSelect`** — 제네릭 타입, `Set` 기반 O(1) 조회, `useMemo` 파생 올바름.

9. **`invitation-cache.ts`** — Redis 실패 시 DB fallback, "캐시 레이어는 절대 throw하지 않음" 원칙 일관 적용.

10. **AI 테마 `sanitizeEnums`** — AI 출력 정규화 후 Zod 검증. 실용적 방어.

11. **`DDayWidget` hydration mismatch 방어** — `timeLeft`를 `null`로 초기화, useEffect 후 업데이트. 올바른 패턴.

12. **어드민 N+1 제거** (`admin/users/route.ts:72-97`) — invitation/AI count를 별도 단일 쿼리로 가져와 in-memory 매핑.

---

## 개선 작업 우선순위 로드맵

### Phase 1: 안전성 (P0, 1-2일)
- [ ] #1 에디터 로드 실패 처리
- [ ] #2 console.log 제거
- [ ] #3 크레딧 차감 순서 통일
- [ ] #4 TOCTOU 트랜잭션 수정
- [ ] #5 타이머 cleanup 보장
- [ ] #6 deep merge 도입

### Phase 2: 렌더링 성능 (P1, 1일)
- [ ] #7 Zustand selector 전체 적용
- [ ] #13 FallingPetals useMemo
- [ ] #14 TemplateTab 테마 비교 ID 기반으로

### Phase 3: UX/모던 패턴 (P1, 2-3일)
- [ ] #9 loading.tsx / error.tsx 추가
- [ ] #10 alert() → useToast 교체
- [ ] #11 invitation: any 타입 해소
- [ ] #8 대시보드 Server Components 전환 (점진적)

### Phase 4: 코드 정리 (P1-P2, 2-3일)
- [ ] #12 requireAuthUser 통일
- [ ] #19 응답 포맷 withErrorHandler 적용
- [ ] #17 stream/route.ts 분리
- [ ] #18 파일 검증 상수 통일
- [ ] #15 usePublishInvitation 훅 추출
- [ ] #16 RSVPForm react-hook-form 전환

### Phase 5: 정비 (P2-P3, 필요 시)
- [ ] #20-30 Medium 이슈들
- [ ] #31-44 Low 이슈들
