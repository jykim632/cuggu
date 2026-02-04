# 2026-02-04: 대시보드 UI 구현 및 청첩장 관리 기능 완성

## 작업한 내용

### 1. 대시보드 사이드바 디자인 개선
- **기존 문제**: 사이드바가 구려 보임 (사용자 피드백)
- **개선 사항**:
  - 로고에 그라데이션 아이콘 추가 (C 로고 with 핑크→보라 배경)
  - 네비게이션 메뉴 스타일 업그레이드
    - 활성 메뉴: 그라데이션 배경 (핑크→보라)
    - 호버 시 아이콘 scale 애니메이션
    - rounded-xl 적용
  - AI 크레딧 섹션을 카드 스타일로 리디자인
    - 3색 그라데이션 배경 (핑크→보라→블루)
    - Sparkles 아이콘 추가
    - 프로그레스바 3색 그라데이션
  - 사용자 프로필 카드 스타일 적용
  - 전체적으로 백드롭 블러, 그라데이션, 마이크로 인터랙션 추가

### 2. 청첩장 목록 페이지 구현 (`/dashboard/invitations`)
- **InvitationCard 컴포넌트**:
  - 썸네일 (없으면 아이콘)
  - 신랑신부 이름, 결혼식 날짜, 조회수, 상태 배지
  - 호버 시 편집/공유/삭제 버튼 오버레이
  - 상대 시간 표시 (date-fns 사용)
- **빈 상태 처리**: 청첩장 없을 때 안내 메시지 + 만들기 버튼
- **API 개선**: 삭제된 청첩장 목록에서 제외 (`status != 'DELETED'`)

### 3. ConfirmDialog 공통 컴포넌트 구현
- **문제 인식**: 브라우저 기본 `confirm()` 대신 예쁜 모달 필요
- **구현**:
  - 3가지 variant (danger, warning, info)
  - Framer Motion 애니메이션
  - ESC 키 및 backdrop 클릭으로 닫기
  - 로딩 상태 지원
  - body 스크롤 방지
- **useConfirm 훅**: Promise 기반 API로 간편한 사용
  ```typescript
  const confirmed = await confirm({
    title: "청첩장을 삭제하시겠습니까?",
    description: "...",
    variant: "danger",
  });
  ```

### 4. 삭제 UX 개선
- **기존 문제**: `window.location.reload()`로 전체 페이지 로딩
- **개선**:
  - state에서만 제거 (onDelete callback)
  - AnimatePresence로 부드러운 삭제 애니메이션 (fade-out + scale)
  - 나머지 카드들 자동 재배치 애니메이션

### 5. 대시보드 통계 데이터 연동
- **기존 문제**: 하드코딩된 값 `0` (사용자 질문)
- **API 구현** (`/api/dashboard/stats`):
  - 내 청첩장 개수 (삭제된 것 제외)
  - 총 조회수 합계 (`SUM(viewCount)`)
  - RSVP 응답 수 (JOIN으로 계산)
- **대시보드 페이지**:
  - 실제 데이터 fetch
  - 로딩 상태 처리
  - 헤더 메시지 동적 변경
  - 청첩장 있을 때 최근 3개 카드 표시
  - "모두 보기" 버튼으로 전체 목록 이동
  - 통계와 최근 청첩장 동시 fetch (병렬 처리)

## 왜 했는지 (맥락)

- **MVP 출시 준비**: 대시보드는 첫 인상을 결정하는 핵심 화면
- **사용자 경험**: 삭제 같은 기본 동작도 부드럽게 처리해야 프리미엄한 느낌
- **재사용성**: ConfirmDialog는 나중에 여러 곳에서 쓸 수 있음

## 논의/아이디어/고민

### 삭제 버튼 위치
**선택지**:
1. 현재 구현 (호버 오버레이) - ✅ 선택
2. 케밥 메뉴 (⋮)
3. 카드 하단 액션바
4. 체크박스 + 일괄 삭제

**결정 이유**:
- 호버 오버레이가 깔끔하고 직관적
- ConfirmDialog로 실수 방지 충분
- 모바일은 롱 프레스로 해결 가능 (나중에 추가)

### 페이지 로딩 vs State 업데이트
**문제**: 삭제 후 `window.location.reload()`는 너무 무거움
**해결**:
- onDelete callback으로 state만 업데이트
- AnimatePresence로 애니메이션 추가
- 서버 데이터와 동기화 보장 (soft delete)

### 대시보드 통계 쿼리 최적화
- 3개 쿼리를 1개로 합칠 수도 있었지만:
  - 가독성 우선 (각 통계 독립적)
  - 쿼리 자체가 빠름 (index 있음)
  - 나중에 캐싱 추가 가능

## 결정된 내용

1. **사이드바 디자인**: 그라데이션 + 마이크로 인터랙션 + 카드 스타일
2. **삭제 확인**: ConfirmDialog 공통 컴포넌트 (재사용 가능)
3. **삭제 애니메이션**: AnimatePresence로 부드럽게 처리
4. **대시보드 통계**: API 연동 + 최근 청첩장 3개 표시

## 기술적 발견

### date-fns 한글 지원
```typescript
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

formatDistanceToNow(new Date(createdAt), {
  addSuffix: true,
  locale: ko,
}); // "3일 전"
```

### AnimatePresence layout 모드
- `mode="popLayout"`: 삭제 시 나머지 요소들 자동 재배치
- 각 요소에 `layout` prop 필요

### Promise 기반 confirm 훅
```typescript
const { confirm, isOpen, options, handleConfirm, handleCancel } = useConfirm();

const confirmed = await confirm({ ... });
if (!confirmed) return;
```
- 기존 브라우저 API와 동일한 사용성
- 커스텀 UI + 비동기 처리

### SQL 집계 함수 Drizzle에서 사용
```typescript
const [{ totalViews }] = await db
  .select({
    totalViews: sql<number>`COALESCE(SUM(${invitations.viewCount}), 0)::int`,
  })
  .from(invitations)
  .where(...);
```
- `COALESCE`로 NULL 처리
- `::int`로 타입 캐스팅

## 느낀 점/난이도/발견

- **난이도**: 중 (UI 디테일에 시간 많이 씀)
- **만족도**: 높음 (사이드바 개선 전후 차이가 확실함)
- **배운 점**:
  - 마이크로 인터랙션(호버, 스케일, 그라데이션)이 체감 품질을 크게 올림
  - 공통 컴포넌트는 처음부터 재사용 고려해서 만들어야 함
  - 삭제 같은 기본 동작도 애니메이션 하나로 인상이 달라짐

## 남은 것/미정

### 미완성
- [ ] 설정 메뉴 구현
  - 계정 정보
  - 플랜 관리 (프리미엄 업그레이드)
  - AI 크레딧 관리
  - 알림 설정
  - 결제 내역
  - 계정 삭제

### 개선 가능
- [ ] 대시보드 통계 캐싱 (Redis)
- [ ] 청첩장 카드 skeleton loading
- [ ] 모바일 호버 대체 (롱 프레스)
- [ ] 삭제 undo 기능 (30초 내 복구)
- [ ] 무한 스크롤 or 페이지네이션 (청첩장 많을 때)

### 검증 필요
- [ ] 삭제 애니메이션 모바일 테스트
- [ ] 통계 API 성능 (청첩장 수백 개일 때)
- [ ] date-fns 번들 사이즈 (tree-shaking 확인)

## 다음 액션

### 우선순위 1 (이번 주)
1. **설정 페이지 구현** (MVP 필수)
   - 계정 정보
   - 플랜 관리
   - AI 크레딧 관리
2. **AI 사진 생성 페이지** (핵심 기능)
3. **결제 연동** (Toss Payments)

### 우선순위 2 (다음 주)
1. RSVP 기능
2. 청첩장 공유 (카카오톡, QR 코드)
3. 이메일 알림

## 서랍 메모

- **디자인 시스템 일관성**: 그라데이션 색상 팔레트 정리 필요
  - 핑크: `from-pink-500 to-pink-600`
  - 보라: `from-purple-500 to-purple-600`
  - 핑크→보라: `from-pink-600 to-purple-600`
  - 3색: `from-pink-500 via-purple-500 to-blue-500`
- **애니메이션 duration 표준화**: 대부분 300ms, framer-motion spring 사용
- **ConfirmDialog variant 확장**: success, custom icon 추가 가능

## 내 질문 평가 및 피드백

### 질문 1: "dashbaord sidabar가 너무 구려. 좀 세련되게 바꿔봐"
- **평가**: 명확한 피드백, 직관적
- **개선점**: 어떤 부분이 구린지 구체적이면 더 좋음 (색상? 간격? 폰트?)
- **결과**: 그라데이션 + 마이크로 인터랙션으로 전체 개선

### 질문 2: "청첩장 삭제 기능은 어디다 붙일까?"
- **평가**: 좋은 질문, 설계 단계에서 논의
- **응답**: 여러 선택지 제시 + 추천안 제공
- **결과**: 호버 오버레이 + ConfirmDialog 조합

### 질문 3: "confirm 용 공통 컴포넌트 만들어서, 필요한 곳에 적용하자."
- **평가**: 완벽한 지시, 재사용성 고려
- **결과**: useConfirm 훅 + ConfirmDialog 컴포넌트

### 질문 4: "삭제할 때 왜 페이지 전체가 로딩되지? 그냥 카드만 없애면 되는데."
- **평가**: 날카로운 UX 피드백
- **문제 인식**: `window.location.reload()` 사용
- **해결**: state 업데이트 + AnimatePresence

### 질문 5: "대시보드에서 내 청첩장, 총 조회수, RSVP 응답 데이터는 왜 안나오지?"
- **평가**: 명확한 버그 리포트
- **원인**: 하드코딩된 값 `0`
- **해결**: API 연동 + 실시간 데이터 표시

### 질문 6: "머야 통계 밑에 청첩장 소개 ui는 왜 사라진거야"
- **평가**: 회귀 버그 발견
- **원인**: EmptyState 조건을 잘못 설정
- **해결**: 최근 청첩장 3개 표시 + "모두 보기" 버튼

---

## 전반적인 피드백

### 잘한 점
- UI/UX에 대한 직관적이고 명확한 피드백
- 재사용성과 성능을 고려한 지시
- 버그를 빠르게 발견하고 지적

### 개선 가능한 점
- 때로는 "왜"를 먼저 물어보면 더 좋은 해결책 나올 수 있음
  - 예: "삭제 기능 어디 붙일까?" → "사용자가 실수로 삭제하는 걸 어떻게 막을까?"
- 우선순위를 명시하면 더 효율적
  - 예: "설정 메뉴는 나중에, 먼저 AI 사진 생성부터"

### 협업 스타일
- 반말, 직관적 표현 → 빠른 소통 가능
- 버그나 문제를 바로바로 지적 → 품질 유지
- 기술적 세부사항보다 결과 중심 → 실용적

---

**다음 세션 시작 시 참고**:
- 설정 페이지 구현 우선
- AI 크레딧 관리 UI 디자인 고민 필요
- Toss Payments 연동 준비 (API 키, 테스트 환경)
