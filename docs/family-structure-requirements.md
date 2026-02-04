# 청첩장 가족 형태 지원 요구사항 문서

## 1. 현황 분석

### 1.1 현재 구현 상태

#### DB 스키마 (db/schema.ts)
```typescript
// invitations 테이블
groomName: varchar('groom_name', { length: 255 }).notNull(),
brideName: varchar('bride_name', { length: 255 }).notNull(),
// 부모님 정보는 DB에 없음 (Zustand store에만 존재)
```

#### Zod 스키마 (schemas/invitation.ts:27-39)
```typescript
export const PersonSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요"),
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
  isDeceased: z.object({
    father: z.boolean().optional(),
    mother: z.boolean().optional(),
  }).optional(),
  phone: z.string().optional(),
  relation: z.string().optional(),
});
```

- ✅ `isDeceased` 필드는 **이미 스키마에 존재**
- ❌ **UI에서 전혀 사용되지 않음**

#### UI (components/editor/tabs/BasicInfoTab.tsx:60-86)
```typescript
// 아버지 이름 입력 (텍스트 필드)
<input value={invitation.groom?.fatherName || ''} />

// 어머니 이름 입력 (텍스트 필드)
<input value={invitation.groom?.motherName || ''} />
```

- ❌ 고인 여부 체크박스 **없음**
- ❌ 한부모 가족 옵션 **없음**
- ❌ 대안 호칭(부·모, 조부모 등) **없음**

#### 템플릿 렌더링 (components/templates/ClassicTemplate.tsx:116, 140)
```typescript
{data.groom.relation ?
  `${data.groom.fatherName}·${data.groom.motherName}의 ${data.groom.relation}`
  : "신랑"}
```

- ❌ **무조건 양부모 있다고 가정**
- ❌ 한부모 가족이면 "홍판서·의 장남" 같은 **이상한 표기** 발생
- ❌ 고인 표기(`故`) **불가능**

---

## 2. 한국 청첩장 가족 표기 케이스

### 2.1 양부모 가족 (전통적)
- **표기**: `홍판서·김씨의 장남 홍길동`
- 가장 일반적인 케이스

### 2.2 한부모 가족

#### A. 어머니만 계신 경우
- **표기**: `김씨의 장남 홍길동`
- 아버지 이름 생략

#### B. 아버지만 계신 경우
- **표기**: `홍판서의 장남 홍길동`
- 어머니 이름 생략

### 2.3 고인이 된 부모님

#### A. 아버지만 고인
- **표기**: `故 홍판서·김씨의 장남 홍길동`
- [출처: 달팽 모바일초대장](http://blog.dalpeng.com/5553)
- **주의**: 돌아가신 지 오래되었으면 이름 생략이 일반적
- **최근 사별**: 하객들이 알고 있고 가족 어르신이 원하시면 `故` 표기

#### B. 어머니만 고인
- **표기**: `홍판서·故 김씨의 장남 홍길동`

#### C. 양부모 모두 고인
- **표기**: `故 홍판서·故 김씨의 자(子) 홍길동`
- [출처: 아하](https://www.a-ha.io/questions/4744c577a96f59d9ba64d037cb765984)
- **중요**: 봉투에는 `故` 표기 금지
- **대안 1**: 삼촌/이모 등 다른 가족을 호주로 표기
- **대안 2**: 부모님 이름 생략하고 본인 이름만

### 2.4 대안 호칭

#### A. 부·모 표기
- **표기**: `부·모의 장남 홍길동`
- 부모님 이름을 공개하고 싶지 않은 경우
- [출처: 블라인드](https://www.teamblind.com/kr/post/%ED%8E%B8%EB%B6%80%EB%AA%A8-%EA%B0%80%EC%A0%95%EC%9D%80-%EC%B2%AD%EC%B2%A9%EC%9E%A5-%EB%B6%80%EB%AA%A8%EB%8B%98-%EC%9D%B4%EB%A6%84-%EC%96%B4%EB%96%BB%EA%B2%8C-%ED%95%B4-q5GcCGjg)

#### B. 조부모님
- **표기**: `조부 홍대감·조모 박씨의 손자 홍길동`
- 부모님 대신 조부모님이 혼주인 경우

#### C. 삼촌/이모 등
- **표기**: `백부 홍판서·백모 김씨의 조카 홍길동`
- 부모님이 안 계시거나 사정이 있는 경우

### 2.5 현대적 독립 표기
- **표기**: `홍길동` (부모님 이름 없이 본인만)
- 재혼, 독립적인 결혼, 부모님과의 거리감 등
- [출처: 브런치](https://brunch.co.kr/@ryul3127/196)

### 2.6 재혼 가족
- **표기**: `홍판서·이씨의 장남 홍길동`
- 보통 재혼 표기는 하지 않음 (불필요한 설명 피함)

---

## 3. 현재 코드의 문제점

### 3.1 데이터 구조 문제

1. **DB 스키마에 부모님 정보 없음**
   - `invitations` 테이블에 `groomName`, `brideName`만 있음
   - 부모님 정보는 Zustand store에만 존재
   - API 저장/복원 시 **데이터 유실 가능**

2. **고인 필드 미사용**
   - Zod 스키마에 `isDeceased` 필드 있음
   - UI에서 전혀 사용되지 않음

### 3.2 UI/UX 문제

1. **다양한 가족 형태 미지원**
   - 한부모 가족: 한 쪽 이름 비워도 렌더링에서 "`·`"만 남음
   - 고인 표기: 체크박스 없어서 `故` 표기 불가능
   - 대안 호칭: "부·모", "조부모" 등 선택 불가

2. **사용자 경험 저하**
   - 한부모 가족 사용자는 빈 칸 남겨야 함 → 불편함
   - 고인 부모님 표기하려면 직접 이름에 "故"를 타이핑해야 함 → 비직관적

3. **접근성 문제**
   - 다양한 가족 형태에 대한 배려 부족
   - 민감한 상황(사별, 이혼 등)을 고려하지 않음

### 3.3 렌더링 로직 문제

#### ClassicTemplate.tsx:116, 140
```typescript
{data.groom.relation ?
  `${data.groom.fatherName}·${data.groom.motherName}의 ${data.groom.relation}`
  : "신랑"}
```

**문제 시나리오:**

1. **어머니만 계신 경우**
   - `fatherName = undefined`, `motherName = "김씨"`
   - 렌더링: `"undefined·김씨의 장남"`
   - ❌ 올바른 표기: `"김씨의 장남"`

2. **아버지만 계신 경우**
   - `fatherName = "홍판서"`, `motherName = undefined`
   - 렌더링: `"홍판서·undefined의 장남"`
   - ❌ 올바른 표기: `"홍판서의 장남"`

3. **부모님 모두 고인인 경우**
   - `fatherName = "홍판서"`, `motherName = "김씨"`, `isDeceased = {father: true, mother: true}`
   - 렌더링: `"홍판서·김씨의 장남"` (故 없음)
   - ❌ 올바른 표기: `"故 홍판서·故 김씨의 자 홍길동"` 또는 부모님 생략

---

## 4. 개선 방안

### 4.1 데이터 구조 개선

#### Option 1: DB 스키마에 부모님 정보 추가 (권장)

**장점:**
- 데이터 영속성 보장
- API 저장/복원 시 유실 없음
- 통계/분석 가능 (예: "부모님 정보 입력률")

**단점:**
- 마이그레이션 필요
- DB 칼럼 증가 (테이블 구조 복잡도 증가)

**구현:**
```typescript
// db/schema.ts
export const invitations = pgTable('invitations', {
  // ... 기존 필드

  // 신랑 가족 정보 (JSONB)
  groomFamily: text('groom_family').notNull(), // JSON string

  // 신부 가족 정보 (JSONB)
  brideFamily: text('bride_family').notNull(), // JSON string
});

// JSONB 구조 (PersonSchema 그대로 사용)
{
  "name": "홍길동",
  "fatherName": "홍판서",
  "motherName": "김씨",
  "isDeceased": { "father": false, "mother": false },
  "relation": "장남",
  "phone": "010-1234-5678",
  "account": { "bank": "신한은행", ... }
}
```

#### Option 2: Zustand store만 사용 (현재 방식)

**장점:**
- 마이그레이션 불필요
- 빠른 구현

**단점:**
- API 저장/복원 로직 복잡 (JSONB로 변환 필요)
- 데이터 유실 위험

**현재 상황:**
- `invitations` 테이블에 `groomName`, `brideName`만 있음
- Zustand store에 `groom`, `bride` 객체 (PersonSchema)
- **API 저장 시 어떻게 처리되는지 불명확**

### 4.2 UI/UX 개선

#### A. BasicInfoTab 개선안

##### 1단계: 가족 표기 모드 선택 (라디오 버튼)

```typescript
enum FamilyDisplayMode {
  FULL_NAMES = "full_names",        // 부모님 실명 표기 (기본)
  SINGLE_PARENT = "single_parent",  // 한부모 가족
  ANONYMOUS = "anonymous",          // 부·모 표기
  GRANDPARENTS = "grandparents",    // 조부모님
  SELF_ONLY = "self_only",          // 본인만
}
```

**UI 레이아웃:**
```
┌─ 신랑 가족 정보 ────────────────────────┐
│ ○ 부모님 실명 표기 (기본)              │
│   ├─ 아버지: [홍판서    ] ☑ 故        │
│   └─ 어머니: [김씨      ] □ 故        │
│                                          │
│ ○ 한부모 가족                           │
│   ├─ 아버지만 계심                      │
│   └─ 어머니만 계심                      │
│                                          │
│ ○ 부·모 표기 (이름 공개 안 함)         │
│                                          │
│ ○ 조부모님 (조부·조모)                 │
│                                          │
│ ○ 본인 이름만 표기                      │
└──────────────────────────────────────────┘
```

##### 2단계: 조건부 필드 렌더링

- **"부모님 실명 표기"** 선택 시:
  - 아버지/어머니 이름 입력 필드
  - 각각 `故` 체크박스
  - 두 분 다 故이면 경고 메시지: "두 분 모두 고인이시면 '본인 이름만 표기'를 권장합니다"

- **"한부모 가족"** 선택 시:
  - 하위 라디오 버튼: "아버지만" / "어머니만"
  - 선택된 쪽만 이름 입력 필드

- **"조부모님"** 선택 시:
  - 조부/조모 이름 입력 필드
  - 관계는 "손자/손녀"로 자동 변경

- **"본인 이름만"** 선택 시:
  - 부모님 정보 입력 필드 숨김

#### B. 템플릿 렌더링 로직 개선

```typescript
// utils/family-display.ts
export function formatFamilyName(person: Person): string {
  const { fatherName, motherName, isDeceased, relation, name, displayMode } = person;

  // 1. 본인 이름만
  if (displayMode === "self_only") {
    return name;
  }

  // 2. 부·모 표기
  if (displayMode === "anonymous") {
    return relation ? `부·모의 ${relation} ${name}` : name;
  }

  // 3. 조부모님
  if (displayMode === "grandparents") {
    const grandpa = person.grandpaName || "조부";
    const grandma = person.grandmaName || "조모";
    const rel = relation === "장남" || relation === "차남" ? "손자" : "손녀";
    return `${grandpa}·${grandma}의 ${rel} ${name}`;
  }

  // 4. 한부모 가족
  if (!fatherName && motherName) {
    const prefix = isDeceased?.mother ? "故 " : "";
    return relation ? `${prefix}${motherName}의 ${relation} ${name}` : name;
  }
  if (fatherName && !motherName) {
    const prefix = isDeceased?.father ? "故 " : "";
    return relation ? `${prefix}${fatherName}의 ${relation} ${name}` : name;
  }

  // 5. 양부모 (고인 표기 포함)
  if (fatherName && motherName) {
    const fatherPrefix = isDeceased?.father ? "故 " : "";
    const motherPrefix = isDeceased?.mother ? "故 " : "";

    // 두 분 다 고인이면 "자(子)" 사용
    const rel = isDeceased?.father && isDeceased?.mother ? "자" : relation;

    return relation
      ? `${fatherPrefix}${fatherName}·${motherPrefix}${motherName}의 ${rel} ${name}`
      : name;
  }

  // 기본: 이름만
  return name;
}
```

#### C. 템플릿 적용

```typescript
// components/templates/ClassicTemplate.tsx:116
<p className="text-xs md:text-sm text-amber-800 mb-3 md:mb-4 font-medium">
  {formatFamilyName(data.groom)}
</p>
```

### 4.3 예시 렌더링

| 입력 | 렌더링 결과 |
|------|------------|
| 모드: 부모님 실명, 아버지: 홍판서, 어머니: 김씨 | `홍판서·김씨의 장남 홍길동` |
| 모드: 한부모(어머니), 어머니: 김씨 | `김씨의 장남 홍길동` |
| 모드: 부모님 실명, 아버지: 홍판서 (故), 어머니: 김씨 | `故 홍판서·김씨의 장남 홍길동` |
| 모드: 부모님 실명, 아버지: 홍판서 (故), 어머니: 김씨 (故) | `故 홍판서·故 김씨의 자 홍길동` |
| 모드: 부·모 표기 | `부·모의 장남 홍길동` |
| 모드: 본인만 | `홍길동` |
| 모드: 조부모, 조부: 홍대감, 조모: 박씨 | `조부 홍대감·조모 박씨의 손자 홍길동` |

---

## 5. 구현 우선순위

### Phase 1: 핵심 기능 (필수)
- [ ] **1.1** DB 스키마 수정 (JSONB 필드 추가)
- [ ] **1.2** BasicInfoTab에 가족 표기 모드 라디오 버튼 추가
- [ ] **1.3** 한부모 가족 UI (아버지만/어머니만 선택)
- [ ] **1.4** 고인 표기 체크박스 (`故`)
- [ ] **1.5** `formatFamilyName()` 유틸 함수 구현
- [ ] **1.6** ClassicTemplate에 적용
- [ ] **1.7** 마이그레이션 스크립트 작성
- [ ] **1.8** API (PUT /api/invitations/[id]) 수정 (JSONB 저장)

### Phase 2: 확장 기능 (추가 가치)
- [ ] **2.1** "부·모" 익명 표기 모드
- [ ] **2.2** 조부모님 모드
- [ ] **2.3** 본인 이름만 모드
- [ ] **2.4** 삼촌/이모 등 대리 호주 모드

### Phase 3: UX 개선 (선택)
- [ ] **3.1** 가족 표기 미리보기 (실시간)
- [ ] **3.2** 고인 부모님 입력 시 안내 메시지
- [ ] **3.3** 다른 템플릿(MODERN, VINTAGE 등)에도 적용
- [ ] **3.4** 통계: "가족 표기 모드 사용 비율" (분석)

---

## 6. 리스크 및 고려사항

### 6.1 마이그레이션 리스크

**문제:** 기존 청첩장은 `groomName`, `brideName`만 있고 부모님 정보 없음

**해결:**
```sql
-- 마이그레이션 스크립트
UPDATE invitations
SET
  groom_family = json_build_object('name', groom_name),
  bride_family = json_build_object('name', bride_name)
WHERE groom_family IS NULL;
```

### 6.2 민감한 주제

- 사별, 이혼, 재혼 등 민감한 가족 상황
- UI 문구는 **중립적이고 배려 있게** 작성
- 예: "한부모 가족" 대신 "한 분만 표기"

### 6.3 템플릿 일관성

- 5개 템플릿 모두 동일한 로직 적용 필요
- `formatFamilyName()` 함수를 공통 유틸로 사용

### 6.4 성능

- JSONB 필드 추가 시 DB 용량 약간 증가
- 인덱스 불필요 (검색하지 않음)

---

## 7. 다음 단계

1. **설계 검토 및 승인**
   - 이 문서 리뷰
   - 마이그레이션 전략 확정

2. **구현 시작**
   - Phase 1 우선 구현
   - DB 스키마 → API → UI → 템플릿 순서

3. **테스트**
   - 다양한 가족 형태 시나리오 테스트
   - 기존 청첩장 마이그레이션 테스트

4. **베타 테스트**
   - 실제 사용자 피드백 수집
   - 다양한 가족 형태 사용자 참여

---

## 8. 참고 자료

- [결혼식 청첩장에 혼주 이름 넣는 법](http://www.ifamily.co.kr/icard/main/card_view/47648)
- [청첩장 고인 혼주 성함 표기 방법 정리 - 달팽 모바일초대장](http://blog.dalpeng.com/5553)
- [청첩장 두분다 고인이면 어떻게 하나요? - 아하](https://www.a-ha.io/questions/4744c577a96f59d9ba64d037cb765984)
- [블라인드 - 편부모 가정은 청첩장 부모님 이름 어떻게 해??](https://www.teamblind.com/kr/post/%ED%8E%B8%EB%B6%80%EB%AA%A8-%EA%B0%80%EC%A0%95%EC%9D%80-%EC%B2%AD%EC%B2%A9%EC%9E%A5-%EB%B6%80%EB%AA%A8%EB%8B%98-%EC%9D%B4%EB%A6%84-%EC%96%B4%EB%96%BB%EA%B2%8C-%ED%95%B4-q5GcCGjg)
- [이혼가정 청첩장 부모님 기재여부 - 브런치](https://brunch.co.kr/@ryul3127/196)
