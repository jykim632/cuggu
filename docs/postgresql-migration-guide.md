# Supabase → 사내 PostgreSQL 마이그레이션 가이드

## 현재 구성 요약

| 항목 | 현재 |
|------|------|
| DB 호스팅 | Supabase (Managed PostgreSQL) |
| ORM | Drizzle ORM 0.45+ |
| 드라이버 | `postgres` (postgres-js) |
| 인증 | NextAuth.js v5 + Drizzle Adapter (Supabase Auth 미사용) |
| 스토리지 | AWS S3 (Supabase Storage 미사용) |
| Realtime | 미사용 |
| 테이블 | 10개 (users, invitations, rsvps, templates, payments, aiGenerations, aiModelSettings, appSettings, accounts, sessions) |
| 마이그레이션 | 4개 (`db/migrations/`) |
| PK 생성 | CUID2 (앱 레벨) |

**Supabase 종속성이 거의 없다.** DB 연결 문자열만 바꾸면 되는 구조.

---

## 1단계: 사내 PostgreSQL 준비

### 1.1 서버 요구사항

- PostgreSQL **15+** (Supabase가 15 사용 중)
- 최소 스펙: 2 vCPU, 4GB RAM, 50GB SSD (초기)
- 한국 리전 권장 (앱 서버와 같은 네트워크)

### 1.2 PostgreSQL 설치 (Ubuntu 예시)

```bash
# PostgreSQL 16 설치
sudo apt update
sudo apt install -y postgresql-16 postgresql-client-16

# 서비스 시작
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

### 1.3 데이터베이스 및 유저 생성

```sql
-- postgres 유저로 접속
sudo -u postgres psql

-- 전용 유저 생성
CREATE USER cuggu_app WITH PASSWORD '<강력한_비밀번호>';

-- 데이터베이스 생성
CREATE DATABASE cuggu OWNER cuggu_app;

-- 필요한 권한
GRANT ALL PRIVILEGES ON DATABASE cuggu TO cuggu_app;

-- UUID 확장 (혹시 필요할 경우)
\c cuggu
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 1.4 접속 설정 (`pg_hba.conf`)

```conf
# 앱 서버 IP에서만 접속 허용
host  cuggu  cuggu_app  <앱서버_IP>/32  scram-sha-256

# 또는 VPN/사내 네트워크 대역
host  cuggu  cuggu_app  10.0.0.0/8  scram-sha-256
```

```conf
# postgresql.conf - 외부 접속 허용
listen_addresses = '*'  # 또는 특정 IP
```

```bash
sudo systemctl reload postgresql
```

---

## 2단계: 데이터 마이그레이션

### 방법 A: Drizzle 마이그레이션으로 스키마 생성 + 데이터 덤프 (권장)

이 방법이 가장 깔끔하다. 스키마는 Drizzle로 생성하고, 데이터만 옮긴다.

#### 2-A.1 새 DB에 스키마 적용

```bash
# .env.local의 DATABASE_URL을 새 서버로 변경
DATABASE_URL="postgresql://cuggu_app:<비밀번호>@<새서버_IP>:5432/cuggu"

# Drizzle 마이그레이션 실행
pnpm db:push
# 또는 마이그레이션 파일 기반으로 실행하려면:
# pnpm drizzle-kit migrate
```

#### 2-A.2 Supabase에서 데이터만 덤프

```bash
# Supabase 연결 정보로 데이터만 덤프 (스키마 제외)
pg_dump \
  --data-only \
  --no-owner \
  --no-privileges \
  --disable-triggers \
  "postgresql://<supabase_user>:<password>@<supabase_host>:5432/postgres" \
  --schema=public \
  -t users -t templates -t invitations -t rsvps \
  -t ai_generations -t payments -t accounts -t sessions \
  -t ai_model_settings -t app_settings \
  > data_dump.sql
```

#### 2-A.3 새 DB에 데이터 복원

```bash
psql "postgresql://cuggu_app:<비밀번호>@<새서버_IP>:5432/cuggu" < data_dump.sql
```

### 방법 B: 풀 덤프/복원 (빠르지만 덜 깔끔)

```bash
# Supabase에서 전체 덤프
pg_dump \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  "postgresql://<supabase_user>:<password>@<supabase_host>:5432/postgres" \
  --schema=public \
  > full_dump.sql

# 새 DB에 복원
psql "postgresql://cuggu_app:<비밀번호>@<새서버_IP>:5432/cuggu" < full_dump.sql
```

> **주의**: Supabase가 자동 생성한 트리거/함수/RLS 정책이 포함될 수 있다. `--clean` 옵션으로 덮어씌우되, 오류가 나면 수동 정리 필요.

---

## 3단계: 앱 코드 변경

### 3.1 환경변수 변경 (유일한 필수 변경)

```bash
# .env.local (또는 배포 환경 변수)

# Before (Supabase)
DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres"

# After (사내)
DATABASE_URL="postgresql://cuggu_app:<password>@<내부IP>:5432/cuggu"
```

### 3.2 커넥션 풀링 설정 변경 (`db/index.ts`)

현재 Vercel Serverless 최적화로 `prepare: false`가 설정되어 있다. 사내 서버 환경에 따라 조정:

```typescript
// db/index.ts - 변경 전
const client = postgres(connectionString, { prepare: false });

// db/index.ts - 사내 서버 (상시 실행 환경)
const client = postgres(connectionString, {
  prepare: true,           // Prepared statements 활성화 (성능 향상)
  max: 20,                 // 커넥션 풀 크기
  idle_timeout: 30,        // 유휴 커넥션 타임아웃 (초)
  connect_timeout: 10,     // 연결 타임아웃 (초)
});

// db/index.ts - Vercel에서 계속 배포하는 경우 (변경 없음)
const client = postgres(connectionString, { prepare: false });
```

**판단 기준:**

| 배포 환경 | `prepare` | `max` | 이유 |
|-----------|-----------|-------|------|
| Vercel Serverless | `false` | 기본값 | 매 요청마다 새 커넥션, prepared statement 불가 |
| Docker/PM2 (상시 실행) | `true` | 10~30 | 커넥션 재사용 가능, 성능 향상 |
| K8s (여러 Pod) | `true` | 5~10 | Pod 수 × max가 DB max_connections 넘지 않게 |

### 3.3 커넥션 풀러 도입 (선택사항)

동시 접속이 많거나 Pod가 여러 개면 PgBouncer 도입 권장:

```bash
# PgBouncer 설치
sudo apt install -y pgbouncer

# /etc/pgbouncer/pgbouncer.ini
[databases]
cuggu = host=127.0.0.1 port=5432 dbname=cuggu

[pgbouncer]
listen_port = 6432
listen_addr = 0.0.0.0
auth_type = scram-sha-256
pool_mode = transaction     # Serverless 호환
max_client_conn = 200
default_pool_size = 20
```

PgBouncer 사용 시 `DATABASE_URL` 포트를 6432로 변경하고, `prepare: false` 유지 (transaction 모드에서 prepared statement 불가).

---

## 4단계: 검증 체크리스트

### 4.1 데이터 무결성 확인

```sql
-- 새 DB에서 실행
-- 테이블별 행 수 비교 (Supabase 결과와 대조)
SELECT 'users' as tbl, COUNT(*) FROM users
UNION ALL SELECT 'invitations', COUNT(*) FROM invitations
UNION ALL SELECT 'rsvps', COUNT(*) FROM rsvps
UNION ALL SELECT 'templates', COUNT(*) FROM templates
UNION ALL SELECT 'ai_generations', COUNT(*) FROM ai_generations
UNION ALL SELECT 'payments', COUNT(*) FROM payments
UNION ALL SELECT 'accounts', COUNT(*) FROM accounts
UNION ALL SELECT 'sessions', COUNT(*) FROM sessions
UNION ALL SELECT 'ai_model_settings', COUNT(*) FROM ai_model_settings
UNION ALL SELECT 'app_settings', COUNT(*) FROM app_settings;
```

### 4.2 FK/인덱스 확인

```sql
-- 외래키 제약조건 확인
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint
WHERE contype = 'f';

-- 인덱스 확인
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename;
```

### 4.3 앱 레벨 테스트

```bash
# 1. 시드 데이터 확인
pnpm db:seed

# 2. Drizzle Studio로 데이터 확인
pnpm db:studio

# 3. 로컬에서 앱 실행 후 기능 테스트
pnpm dev
```

**필수 테스트 항목:**
- [ ] 카카오 로그인 (accounts, sessions, users 테이블)
- [ ] 청첩장 생성/수정/조회 (invitations)
- [ ] AI 사진 생성 (ai_generations, users.aiCredits)
- [ ] RSVP 제출 (rsvps)
- [ ] 관리자 설정 (ai_model_settings, app_settings)

---

## 5단계: 운영 설정

### 5.1 백업

```bash
# 일일 백업 cron (매일 새벽 3시)
# /etc/cron.d/cuggu-backup
0 3 * * * postgres pg_dump -Fc cuggu > /backups/cuggu_$(date +\%Y\%m\%d).dump

# 7일 이상 된 백업 삭제
0 4 * * * root find /backups -name "cuggu_*.dump" -mtime +7 -delete
```

### 5.2 모니터링

```sql
-- 활성 커넥션 수 확인
SELECT count(*) FROM pg_stat_activity WHERE datname = 'cuggu';

-- 슬로우 쿼리 로깅 활성화 (postgresql.conf)
-- log_min_duration_statement = 1000  # 1초 이상 쿼리 로깅
```

### 5.3 보안

- [ ] `pg_hba.conf`에서 접속 IP 제한
- [ ] SSL 연결 강제 (`sslmode=require`)
- [ ] DB 비밀번호 시크릿 매니저로 관리
- [ ] 정기적 PostgreSQL 보안 업데이트

SSL 사용 시 연결 문자열:
```bash
DATABASE_URL="postgresql://cuggu_app:<password>@<IP>:5432/cuggu?sslmode=require"
```

---

## 마이그레이션 타임라인

| 순서 | 작업 | 예상 다운타임 |
|------|------|-------------|
| 1 | 사내 PostgreSQL 서버 구축 | 없음 |
| 2 | 스키마 생성 (`db:push`) | 없음 |
| 3 | 데이터 동기화 테스트 | 없음 |
| 4 | 앱 기능 테스트 (스테이징) | 없음 |
| 5 | **본 마이그레이션** (아래 참조) | **5~15분** |
| 6 | 모니터링 및 안정화 | 없음 |

### 본 마이그레이션 절차 (다운타임 최소화)

```bash
# 1. 앱 점검 모드 전환 (트래픽 차단)
# 2. Supabase에서 최종 데이터 덤프
pg_dump --data-only --no-owner --no-privileges --disable-triggers \
  "<SUPABASE_URL>" --schema=public > final_dump.sql

# 3. 새 DB에 복원
psql "<NEW_DB_URL>" < final_dump.sql

# 4. 행 수 비교 검증

# 5. DATABASE_URL 환경변수 변경 후 앱 재배포

# 6. 핵심 기능 스모크 테스트

# 7. 점검 모드 해제
```

---

## 롤백 계획

마이그레이션 후 문제 발생 시:

1. `DATABASE_URL`을 Supabase 연결 문자열로 복구
2. 앱 재배포
3. Supabase에서 마이그레이션 이후 생성된 데이터는 수동 확인 필요

> Supabase 프로젝트는 마이그레이션 완료 후 **최소 2주** 유지하고, 안정성 확인 후 삭제 권장.

---

## FAQ

**Q: Supabase 특유 기능을 쓰고 있나?**
A: 아니다. Auth, Storage, Realtime 전부 미사용. 순수 PostgreSQL 연결만 사용 중이라 이관이 간단하다.

**Q: Drizzle 마이그레이션 파일은 그대로 쓸 수 있나?**
A: 그렇다. `db/migrations/` 폴더의 4개 SQL 파일은 표준 PostgreSQL DDL이라 어디서든 동작한다.

**Q: CUID2 PK가 문제되나?**
A: 아니다. CUID2는 앱 레벨에서 생성하는 문자열이라 DB 종류와 무관하다.

**Q: 배포를 Vercel에서 계속하면?**
A: `prepare: false`를 유지하고, 사내 DB에 외부 접속 허용 + SSL 필수 설정. 또는 Vercel → VPN 터널을 구성해야 한다.
