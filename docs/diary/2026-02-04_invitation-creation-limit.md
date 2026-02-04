# 청첩장 생성 개수 제한 기능

**날짜**: 2026-02-04
**브랜치**: feature/invitation-creation-limit
**커밋**: 8efb52b

## 작업 내용

청첩장을 무제한으로 생성할 수 있는 문제 발견. 스팸/어뷰징 방지 및 비즈니스 모델을 위해 플랜별 생성 개수 제한 구현.

### 제한 정책
- **무료 플랜**: 최대 3개 (대부분 사용자는 1개만 필요)
- **프리미엄 플랜**: 최대 20개 (웨딩 플래너/대행 업체용)
- **20개 초과**: 고객센터 별도 문의

### 핵심 구현
```typescript
// app/api/invitations/route.ts

// 1. 사용자 premiumPlan 확인
const user = await db.query.users.findFirst({
  where: eq(users.id, session.user.id),
});

// 2. 활성 청첩장 개수 조회 (DELETED 제외)
const [{ count: activeCount }] = await db
  .select({ count: sql<number>`count(*)::int` })
  .from(invitations)
  .where(
    and(
      eq(invitations.userId, session.user.id),
      ne(invitations.status, 'DELETED')
    )
  );

// 3. 제한 확인
const limit = user.premiumPlan === 'PREMIUM' ? 20 : 3;
if (activeCount >= limit) {
  return NextResponse.json({ error, message }, { status: 403 });
}
```

### 에러 메시지
```typescript
// 무료 플랜
{
  error: "무료 플랜은 최대 3개까지 생성 가능합니다",
  message: "프리미엄 플랜으로 업그레이드하면 최대 20개까지 생성할 수 있습니다",
  currentCount: 3,
  limit: 3
}

// 프리미엄 플랜
{
  error: "청첩장 생성 한도에 도달했습니다",
  message: "20개 이상 필요하신 경우 고객센터로 문의해주세요",
  currentCount: 20,
  limit: 20
}
```

### 수정된 파일
1. `app/api/invitations/route.ts` - 개수 제한 로직 추가
2. `components/admin/EmptyState.tsx` - 에러 처리 개선
3. `schemas/invitation.ts` - UpdateInvitationSchema 필드 추가
4. 기타 TypeScript 타입 에러 수정 (5개 파일)

## 왜 했는지

### 1. 비즈니스적 이유
- **무제한 생성 문제**: 어뷰징 가능성 (1명이 수백 개 생성)
- **서버 비용**: 불필요한 DB 부하 및 스토리지 낭비
- **프리미엄 차별화**: 무료 vs 유료 플랜 명확한 차이 필요

### 2. 현실적인 사용 패턴
- 일반 사용자: 1개만 필요 (결혼식 1번)
- 웨딩 플래너: 여러 고객 관리 → 10~20개
- 3개 제한은 재혼, 테스트 등 여유분 고려

### 3. 경쟁사 분석
- A사: 무료 2개, 유료 10개
- B사: 무료 3개, 유료 무제한
- 우리: 무료 3개, 유료 20개 (중간 선택)

## 논의/고민

### 제한 개수 결정
- **무료 1개 vs 3개**: 너무 빡빡하면 이탈 → 3개로 여유 제공
- **프리미엄 무제한 vs 20개**: 무제한은 어뷰징 위험 → 20개면 충분
- **결정**: 무료 3개, 프리미엄 20개

### 삭제된 청첩장 처리
- **옵션 1**: DELETED도 개수에 포함 (복구 방지)
- **옵션 2**: DELETED 제외 (재사용 허용)
- **결정**: DELETED 제외 → 사용자 편의성 우선

### 에러 메시지 톤
- 처음: "생성 한도 초과" (차갑게)
- 수정: "최대 3개까지 생성 가능합니다" (친절하게)
- 추가: 업그레이드 안내 메시지

## 결정된 내용

### API 응답 형식
```typescript
// 403 Forbidden
{
  error: string,        // 주 메시지
  message: string,      // 부가 설명 (해결 방법)
  currentCount: number, // 현재 청첩장 개수
  limit: number         // 제한 개수
}
```

### 개수 확인 쿼리
```typescript
// DELETED 제외한 활성 청첩장만
where(
  and(
    eq(invitations.userId, session.user.id),
    ne(invitations.status, 'DELETED')
  )
)
```

### 프론트엔드 처리
```typescript
// EmptyState.tsx
if (response.status === 403) {
  alert(`${result.error}\n\n${result.message}`);
}
```

## 어려웠던 점

### 1. 기존 코드 타입 에러들
- `parsed.error.errors` → `issues` (Zod)
- UpdateInvitationSchema에 필드 누락
- vitest.setup.ts의 NODE_ENV read-only 에러
- 연쇄적으로 8개 파일 수정 필요

### 2. 빌드 반복 실패
- 타입 에러 하나 고치면 다른 에러 등장
- 총 5번 빌드 시도 끝에 성공
- 근본 원인: 스키마 정의 불완전

### 3. 테스트 고민
- 실제 DB로 테스트할 수 없음 (seed 데이터 없음)
- 수동 테스트 필요 → 프리미엄 전환 기능도 아직 없음
- 일단 로직만 구현, 나중에 E2E 테스트

## 발견/배운 점

### Drizzle ORM 쿼리 패턴
```typescript
// count 쿼리
const [{ count }] = await db
  .select({ count: sql<number>`count(*)::int` })
  .from(invitations)
  .where(...);

// and/ne 조합
where(
  and(
    eq(invitations.userId, userId),
    ne(invitations.status, 'DELETED')
  )
)
```

### Zod 에러 구조
```typescript
// ❌ 잘못된 방법
parsed.error.errors

// ✅ 올바른 방법
parsed.error.issues
```

### TypeScript strict mode
- process.env.NODE_ENV는 read-only
- 직접 할당 불가 → 조건문으로 처리

## 성능 고려

### 최적화된 부분
- count 쿼리만 실행 (데이터 fetch 없음)
- 인덱스 활용 (userId + status)
- 사용자 조회와 개수 조회 병렬 가능 (현재는 순차)

### 개선 가능
```typescript
// 현재: 순차 실행
const user = await db.query.users.findFirst(...);
const [{ count }] = await db.select(...);

// 개선: Promise.all로 병렬화
const [user, [{ count }]] = await Promise.all([
  db.query.users.findFirst(...),
  db.select(...)
]);
```

## 남은 것

### 기능
- [ ] 청첩장 삭제 기능 (DELETED 상태 전환)
- [ ] 프리미엄 결제 기능
- [ ] 대시보드에서 현재 개수 표시
- [ ] 생성 시 남은 개수 알림

### 테스트
- [ ] 단위 테스트 (API route)
- [ ] E2E 테스트 (생성 3번 → 4번째 거부)
- [ ] 프리미엄 전환 후 20개 테스트

### UX 개선
- [ ] alert 대신 토스트 메시지
- [ ] 생성 버튼에 "3개 중 0개 사용" 표시
- [ ] 제한 도달 시 프리미엄 구매 모달

## 다음 액션

1. **대시보드 목록 표시** (우선순위 높음)
   - 현재 하드코딩된 0 → 실제 API 호출
   - 청첩장 카드 컴포넌트 구현
   - 생성/편집/삭제 버튼

2. **청첩장 삭제 기능**
   - DELETE /api/invitations/[id]
   - 소프트 삭제 (status = 'DELETED')
   - 확인 모달

3. **프리미엄 결제 연동**
   - Toss Payments API
   - 결제 성공 시 premiumPlan 업데이트
   - 크레딧 충전 (AI 사진 생성용)

## 서랍메모

### 나중에 고려할 것
- 대량 사용자 (웨딩홀) 별도 요금제 (50개, 100개)
- 기업용 플랜 (무제한, 화이트라벨)
- 청첩장 아카이빙 (결혼식 끝난 것 자동 보관)

### 모니터링
- 사용자별 청첩장 생성 개수 통계
- 3개 제한 도달 비율 (→ 프리미엄 전환율)
- 20개 초과 문의 빈도

## 난이도
⭐⭐☆☆☆ (쉬움)

- 비즈니스 로직 자체는 단순 (count 비교)
- 하지만 기존 타입 에러들 수정하느라 시간 소요
- 전체 흐름 이해하면 30분 작업

## 예상 시간 vs 실제 시간
- 예상: 30분 (제한 로직만)
- 실제: 1.5시간 (타입 에러 수정 포함)
- 차이 이유: 연쇄적인 빌드 에러들

---

**다음 작업**: 대시보드 청첩장 목록 구현
