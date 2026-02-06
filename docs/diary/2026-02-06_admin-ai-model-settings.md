# 2026-02-06 Admin 설정 관리 시스템 - AI 모델 관리 구현

## 작업한 내용

DB 기반 설정 관리 체계의 1차 구현. AI 모델 on/off를 Admin에서 관리할 수 있게 했다.

### 핵심 변경
1. **DB 테이블 2개 추가**: `ai_model_settings` (AI 모델별 설정), `app_settings` (범용 설정 - 스키마만)
2. **Admin AI 모델 관리 API**: GET (코드 + DB 조인), PATCH (upsert + 최소 1개 활성 보장)
3. **유저용 모델 목록 API**: enabled 모델만 필터링해서 반환
4. **Admin UI 페이지**: 모델 카드 + 활성화/추천 토글 스위치
5. **AIPhotoGenerator 리팩터링**: 하드코딩된 모델 목록 → API fetch 방식으로 전환

### 변경 파일 (6개)
```
db/schema.ts                                    # 테이블 2개 추가
app/api/admin/ai-models/route.ts                # Admin API (GET/PATCH) [신규]
app/api/ai/models/route.ts                      # 유저용 활성 모델 API [신규]
app/admin/ai-models/page.tsx                    # Admin UI 페이지 [신규]
components/admin/AdminNav.tsx                   # AI 모델 네비 항목 추가
components/editor/tabs/gallery/AIPhotoGenerator.tsx  # API fetch 방식으로 전환
db/migrations/0003_lovely_darwin.sql            # Migration SQL [신규]
```

---

## 왜 했는지 (맥락)

AI 모델 가격/활성화 상태를 바꾸려면 매번 코드 수정 + 배포가 필요했다. 운영 중에 특정 모델이 문제 생기면 즉시 비활성화할 수 없는 상황. DB 기반으로 전환해서 Admin에서 즉시 제어 가능하게.

`appSettings` 테이블도 같이 만들어두어 향후 가격 설정, 크레딧 한도 등도 같은 패턴으로 확장할 기반 마련.

---

## 논의/아이디어/고민

- **코드 메타데이터 vs DB 메타데이터**: 모델 이름, provider, 비용 같은 정적 정보는 `lib/ai/models.ts`의 `AI_MODELS`에 유지. DB에는 운영 설정(enabled, isRecommended, sortOrder)만 저장. 이렇게 하면 코드 deploy 없이 on/off만 가능하고, 새 모델 추가 시엔 코드 변경이 필요함 → 적절한 트레이드오프
- **appSettings 활용**: key-value + category 구조로 범용 설정 저장. 다음 단계에서 AI 크레딧 가격, 생성 한도 등을 여기에 넣을 계획
- **Migration 드리프트**: `drizzle-kit generate` 시 이전에 직접 적용한 변경들(ai_style enum, extended_data)도 같이 포함됨. 수동으로 해당 부분 제거 후 적용

---

## 결정된 내용

- AI 모델 메타데이터(이름, 비용 등)는 코드에 유지, 운영 설정만 DB
- `aiModelSettings`는 모델 ID 기준 PK, DB에 없으면 기본값(enabled=true, isRecommended=false) 적용
- 최소 1개 모델 활성화 보장 (API에서 검증)
- `appSettings`는 스키마만 추가, UI는 다음 단계

---

## 느낀 점/난이도/발견

- **난이도**: 낮음. 기존 Admin 패턴(requireAdmin, withErrorHandler, stone 컬러 UI)이 잘 잡혀 있어서 따라 만들기 쉬웠다
- **발견**: Drizzle migration이 DB 상태와 스키마 코드 사이의 드리프트를 전부 잡아서 migration에 넣어버림. `drizzle-kit push`로 직접 적용한 것들이 migration에 또 나옴 → migration 파일은 항상 수동 검토 필요

---

## 남은 것/미정

- [ ] `appSettings` Admin UI (가격, 한도 등 범용 설정 관리)
- [ ] AI 모델 sortOrder 드래그 정렬 (현재는 DB에 필드만 있고 UI 없음)
- [ ] 새 AI 모델 추가 시 자동 seed 또는 Admin에서 코드 외 모델 등록 기능

---

## 다음 액션

1. Admin에서 AI 모델 토글 테스트 → 에디터에서 비활성 모델 미노출 확인
2. `appSettings` 활용한 가격/한도 설정 관리 UI 구현
