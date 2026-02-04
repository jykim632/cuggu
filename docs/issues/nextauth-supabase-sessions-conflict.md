# NextAuth와 Supabase Auth Sessions 테이블 충돌 이슈

> **발견일**: 2026-02-04
> **우선순위**: P2 (Medium) - 현재 동작하지만 나중에 문제 발생 가능
> **상태**: 미해결

---

## 문제 상황

Drizzle 마이그레이션 실행 시 `sessions` 테이블 관련 오류 발생:

```
ERROR: 42704: constraint "sessions_session_token_unique" of relation "sessions" does not exist
```

### 원인

**NextAuth.js**와 **Supabase Auth**가 동일한 `sessions` 테이블을 사용하려고 시도:

#### 1. NextAuth 필드 (Drizzle 스키마)
```typescript
// db/schema.ts
export const sessions = pgTable('sessions', {
  sessionToken: varchar('session_token', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 128 }).notNull(),
  expires: timestamp('expires').notNull(),
});
```

#### 2. Supabase Auth 내부 필드 (실제 DB)
```json
[
  { "column_name": "id", "data_type": "uuid" },
  { "column_name": "user_id", "data_type": "uuid" },
  { "column_name": "factor_id", "data_type": "uuid" },
  { "column_name": "aal", "data_type": "USER-DEFINED" },
  { "column_name": "created_at", "data_type": "timestamp with time zone" },
  { "column_name": "refresh_token_hmac_key", "data_type": "text" },
  // ... 총 18개 컬럼
]
```

→ **충돌**: 같은 테이블에 다른 구조를 요구

---

## 현재 해결 방법 (임시)

`users` 테이블 마이그레이션만 실행:

```sql
-- sessions 테이블 마이그레이션 건너뛰고, users만 업데이트
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_notifications" boolean DEFAULT true NOT NULL;
```

**영향**:
- ✅ 설정 페이지 정상 동작
- ✅ NextAuth 로그인 정상 동작 (Supabase Auth 테이블 사용)
- ⚠️ Drizzle 스키마와 실제 DB 불일치
- ⚠️ 나중에 마이그레이션 문제 발생 가능

---

## 영구 해결 방안

### Option 1: NextAuth Sessions 테이블 이름 변경 (추천)

**장점**:
- Supabase Auth와 완전 분리
- 마이그레이션 오류 없음

**단점**:
- NextAuth 설정 변경 필요
- 기존 세션 데이터 마이그레이션

**구현**:

1. Drizzle 스키마 수정:
```typescript
// db/schema.ts
export const nextauthSessions = pgTable('nextauth_sessions', {
  sessionToken: varchar('session_token', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 128 }).notNull(),
  expires: timestamp('expires').notNull(),
});
```

2. NextAuth 설정 업데이트:
```typescript
// lib/auth.ts
export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: nextauthSessions, // 변경
  }),
};
```

3. 마이그레이션 실행:
```sql
-- 새 테이블 생성
CREATE TABLE nextauth_sessions (
  session_token VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(128) NOT NULL,
  expires TIMESTAMP NOT NULL
);

-- 기존 데이터 복사 (있을 경우)
-- INSERT INTO nextauth_sessions SELECT ...
```

---

### Option 2: Auth 스키마 분리

**장점**:
- 논리적 분리 (public vs auth)
- Supabase Auth 영향 없음

**단점**:
- 스키마 간 쿼리 복잡도 증가
- Drizzle 설정 변경 필요

**구현**:
```typescript
export const sessions = pgTable('sessions', { ... }, {
  schema: 'auth',
});
```

---

### Option 3: Supabase Auth 비활성화

**장점**:
- NextAuth만 사용 (단순화)

**단점**:
- Supabase 기본 기능 사용 불가
- RLS 정책 직접 구현 필요

---

## 권장 사항

### Phase 1 (MVP): 현재 상태 유지
- `users` 테이블만 마이그레이션
- NextAuth + Supabase Auth 혼용
- 문서화 완료 ✅

### Phase 2 (정식 출시 전): Option 1 적용
- `nextauth_sessions` 테이블로 분리
- 마이그레이션 스크립트 작성
- 테스트 후 배포

---

## 관련 파일

- `db/schema.ts` - Drizzle 스키마 정의
- `lib/auth.ts` - NextAuth 설정
- `db/migrations/0002_wandering_roulette.sql` - 충돌 발생 마이그레이션

---

## 참고 자료

- [NextAuth Drizzle Adapter](https://authjs.dev/reference/adapter/drizzle)
- [Supabase Auth Schema](https://supabase.com/docs/guides/auth/managing-user-data)
- [Drizzle Schema Management](https://orm.drizzle.team/docs/schemas)

---

## 다음 단계

1. ✅ 문서 작성 완료
2. ⏳ beads task 생성
3. ⏳ Phase 2에서 Option 1 구현
4. ⏳ 마이그레이션 스크립트 작성
5. ⏳ 테스트 및 배포
