# 부모님 계좌 추가 기능 구현 계획

## 개요

청첩장 editor의 AccountTab에서 신랑/신부 본인 계좌뿐만 아니라 부모님(아버지/어머니) 계좌도 여러 개 추가할 수 있는 기능 구현.

**선택된 방향**:
- 2단계 구현: 1) 필드명 버그 수정 먼저 → 2) 부모님 계좌 추가
- 중첩 구조 + 배열: `groom.parentAccounts.father[]`, `groom.parentAccounts.mother[]`
- 각 부모님별 복수 계좌 허용

---

## Phase 1: 필드명 불일치 버그 수정

### 현재 문제

| 위치 | 필드명 | 문제점 |
|------|--------|--------|
| AccountTab | `bankAccount.accountNumber`, `accountHolder` | ❌ 스키마와 불일치 |
| Schema | `account.number`, `holder` | ✅ 정의됨 |
| ClassicTemplate | `account.bank`, `number`, `holder` | ✅ 스키마 따름 |
| Sidebar | `bankAccount` 체크 | ❌ 스키마와 불일치 |

**결과**: AccountTab에서 입력한 데이터가 ClassicTemplate에서 표시 안 됨

### 수정 내역

#### 1. Schema 필드명 통일 (`schemas/invitation.ts`)

**변경 전**:
```typescript
export const AccountSchema = z.object({
  bank: z.string().min(1, "은행을 선택해주세요"),
  number: z.string().min(1, "계좌번호를 입력해주세요"),
  holder: z.string().min(1, "예금주를 입력해주세요"),
});
```

**변경 후**:
```typescript
export const AccountSchema = z.object({
  bank: z.string().min(1, "은행을 선택해주세요"),
  accountNumber: z.string().min(1, "계좌번호를 입력해주세요"),  // ✅ 통일
  accountHolder: z.string().min(1, "예금주를 입력해주세요"),  // ✅ 통일
});
```

#### 2. AccountTab 필드명 변경 (`components/editor/tabs/AccountTab.tsx`)

**변경 전**:
```typescript
invitation.groom?.bankAccount?.bank
invitation.groom?.bankAccount?.accountNumber
invitation.groom?.bankAccount?.accountHolder
```

**변경 후**:
```typescript
invitation.groom?.account?.bank
invitation.groom?.account?.accountNumber
invitation.groom?.account?.accountHolder
```

**핸들러 변경**:
```typescript
// 변경 전
handleGroomAccountChange('accountNumber', value)
→ invitation.groom.bankAccount.accountNumber 업데이트

// 변경 후
handleGroomAccountChange('accountNumber', value)
→ invitation.groom.account.accountNumber 업데이트
```

#### 3. ClassicTemplate 필드명 변경 (`components/templates/ClassicTemplate.tsx`)

**변경 전**:
```typescript
{data.groom.account.bank} {data.groom.account.number}
예금주: {data.groom.account.holder}
```

**변경 후**:
```typescript
{data.groom.account.bank} {data.groom.account.accountNumber}
예금주: {data.groom.account.accountHolder}
```

#### 4. Sidebar 검증 로직 변경 (`components/editor/Sidebar.tsx`)

**변경 전**:
```typescript
const hasGroomAccount =
  invitation.groom?.bankAccount?.bank &&
  invitation.groom?.bankAccount?.accountNumber;
```

**변경 후**:
```typescript
const hasGroomAccount =
  invitation.groom?.account?.bank &&
  invitation.groom?.account?.accountNumber;
```

#### 5. PreviewPanel 기본값 처리 (`components/editor/PreviewPanel.tsx`)

PreviewPanel의 `previewData`에서 `account` 필드 기본값 처리 확인 및 수정 (이미 올바르게 구현되어 있을 가능성 높음)

---

## Phase 2: 부모님 계좌 추가 기능

### 스키마 확장

#### 1. ParentAccountsSchema 추가 (`schemas/invitation.ts`)

```typescript
// 부모님 계좌 (각 부모님별 복수 계좌 허용)
export const ParentAccountsSchema = z.object({
  father: z.array(AccountSchema).default([]),   // 아버지 계좌들
  mother: z.array(AccountSchema).default([]),   // 어머니 계좌들
}).optional();

// PersonSchema 확장
groom: PersonSchema.extend({
  account: AccountSchema.optional(),        // 본인 계좌 (1개)
  parentAccounts: ParentAccountsSchema,     // 부모님 계좌들
}),
bride: PersonSchema.extend({
  account: AccountSchema.optional(),
  parentAccounts: ParentAccountsSchema,
}),
```

**데이터 구조 예시**:
```typescript
groom: {
  name: "김민수",
  fatherName: "김철수",
  motherName: "박영희",
  account: {
    bank: "신한은행",
    accountNumber: "110-123-456789",
    accountHolder: "김민수",
  },
  parentAccounts: {
    father: [
      {
        bank: "국민은행",
        accountNumber: "123-456-789012",
        accountHolder: "김철수",
      },
      // 필요시 추가 계좌
    ],
    mother: [
      {
        bank: "우리은행",
        accountNumber: "987-654-321098",
        accountHolder: "박영희",
      },
    ],
  },
}
```

### AccountTab UI 개선

#### 1. 컴포넌트 구조

```
AccountTab
├─ 신랑측 계좌 섹션
│  ├─ 본인 계좌 폼
│  ├─ [부모님 계좌 관리] 토글
│  │  ├─ 아버지 계좌 목록
│  │  │  ├─ 계좌 #1 폼
│  │  │  ├─ 계좌 #2 폼
│  │  │  └─ [+ 아버지 계좌 추가] 버튼
│  │  └─ 어머니 계좌 목록
│  │     ├─ 계좌 #1 폼
│  │     └─ [+ 어머니 계좌 추가] 버튼
└─ 신부측 계좌 섹션 (동일 구조)
```

#### 2. UI 흐름

1. **기본 상태**: 본인 계좌만 표시
2. **"부모님 계좌 관리" 버튼 클릭**:
   - 접이식 섹션 확장
   - 아버지/어머니 계좌 목록 표시
3. **"아버지 계좌 추가" 버튼**:
   - 새 계좌 폼 추가
   - 예금주 자동 입력 (`fatherName` 사용)
4. **계좌 삭제**: 각 계좌 폼에 [삭제] 버튼

#### 3. 핸들러 함수

```typescript
// 부모님 계좌 추가
const handleAddParentAccount = (
  side: 'groom' | 'bride',
  parent: 'father' | 'mother'
) => {
  const currentAccounts = invitation[side]?.parentAccounts?.[parent] || [];
  const parentName = parent === 'father'
    ? invitation[side]?.fatherName
    : invitation[side]?.motherName;

  updateInvitation({
    [side]: {
      ...invitation[side],
      parentAccounts: {
        ...invitation[side]?.parentAccounts,
        [parent]: [
          ...currentAccounts,
          {
            bank: '',
            accountNumber: '',
            accountHolder: parentName || '', // 자동 입력
          },
        ],
      },
    },
  });
};

// 부모님 계좌 수정
const handleUpdateParentAccount = (
  side: 'groom' | 'bride',
  parent: 'father' | 'mother',
  index: number,
  field: string,
  value: string
) => {
  const accounts = [...(invitation[side]?.parentAccounts?.[parent] || [])];
  accounts[index] = { ...accounts[index], [field]: value };

  updateInvitation({
    [side]: {
      ...invitation[side],
      parentAccounts: {
        ...invitation[side]?.parentAccounts,
        [parent]: accounts,
      },
    },
  });
};

// 부모님 계좌 삭제
const handleRemoveParentAccount = (
  side: 'groom' | 'bride',
  parent: 'father' | 'mother',
  index: number
) => {
  const accounts = [...(invitation[side]?.parentAccounts?.[parent] || [])];
  accounts.splice(index, 1);

  updateInvitation({
    [side]: {
      ...invitation[side],
      parentAccounts: {
        ...invitation[side]?.parentAccounts,
        [parent]: accounts,
      },
    },
  });
};
```

#### 4. UI 컴포넌트 (예시)

```tsx
{/* 부모님 계좌 관리 섹션 */}
<div className="mt-4">
  <button
    onClick={() => setShowParentAccounts(!showParentAccounts)}
    className="text-sm text-pink-600 hover:text-pink-700"
  >
    {showParentAccounts ? '▼' : '▶'} 부모님 계좌 관리
  </button>

  {showParentAccounts && (
    <div className="mt-3 space-y-4">
      {/* 아버지 계좌 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-700">
            아버지 ({invitation.groom?.fatherName || '이름 미입력'})
          </span>
          <button
            onClick={() => handleAddParentAccount('groom', 'father')}
            className="text-xs text-pink-600 hover:text-pink-700"
          >
            + 계좌 추가
          </button>
        </div>

        {invitation.groom?.parentAccounts?.father?.map((account, idx) => (
          <div key={idx} className="p-3 bg-slate-50 rounded-lg space-y-2 mb-2">
            <div className="flex justify-between items-start">
              <span className="text-xs text-slate-500">계좌 #{idx + 1}</span>
              <button
                onClick={() => handleRemoveParentAccount('groom', 'father', idx)}
                className="text-xs text-red-600 hover:text-red-700"
              >
                삭제
              </button>
            </div>

            {/* 은행 선택 */}
            <select
              value={account.bank}
              onChange={(e) => handleUpdateParentAccount('groom', 'father', idx, 'bank', e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg"
            >
              <option value="">은행 선택</option>
              {banks.map(bank => <option key={bank} value={bank}>{bank}</option>)}
            </select>

            {/* 계좌번호 */}
            <input
              type="text"
              value={account.accountNumber}
              onChange={(e) => handleUpdateParentAccount('groom', 'father', idx, 'accountNumber', e.target.value)}
              placeholder="계좌번호"
              className="w-full px-3 py-2 text-sm border rounded-lg"
            />

            {/* 예금주 */}
            <input
              type="text"
              value={account.accountHolder}
              onChange={(e) => handleUpdateParentAccount('groom', 'father', idx, 'accountHolder', e.target.value)}
              placeholder="예금주"
              className="w-full px-3 py-2 text-sm border rounded-lg"
            />
          </div>
        ))}
      </div>

      {/* 어머니 계좌 (동일 구조) */}
    </div>
  )}
</div>
```

### ClassicTemplate 렌더링 확장

#### 1. 부모님 계좌 표시 로직

```tsx
{/* 계좌번호 섹션 */}
{data.settings.showAccounts && (
  data.groom.account ||
  data.groom.parentAccounts?.father?.length > 0 ||
  data.groom.parentAccounts?.mother?.length > 0 ||
  data.bride.account ||
  data.bride.parentAccounts?.father?.length > 0 ||
  data.bride.parentAccounts?.mother?.length > 0
) && (
  <section className="py-12 md:py-20 px-6">
    <h2 className="text-xl md:text-2xl font-serif text-center text-gray-800 mb-8 md:mb-12">
      마음 전하실 곳
    </h2>

    <div className="space-y-6 md:space-y-8">
      {/* 신랑 측 */}
      {(data.groom.account ||
        data.groom.parentAccounts?.father?.length > 0 ||
        data.groom.parentAccounts?.mother?.length > 0) && (
        <div>
          <p className="text-sm md:text-base text-amber-800 mb-3 font-semibold">
            신랑 측
          </p>
          <div className="space-y-3">
            {/* 본인 계좌 */}
            {data.groom.account && (
              <div className="p-4 md:p-5 bg-white rounded-xl shadow-sm border border-amber-100">
                <p className="text-xs text-slate-500 mb-2">신랑 본인</p>
                <p className="text-sm md:text-base text-gray-800 font-medium mb-1">
                  {data.groom.name}
                </p>
                <p className="text-xs md:text-sm text-gray-600">
                  {data.groom.account.bank} {data.groom.account.accountNumber}
                </p>
                <p className="text-xs text-gray-500">
                  예금주: {data.groom.account.accountHolder}
                </p>
              </div>
            )}

            {/* 아버지 계좌들 */}
            {data.groom.parentAccounts?.father?.map((account, idx) => (
              <div key={`father-${idx}`} className="p-4 md:p-5 bg-white rounded-xl shadow-sm border border-amber-100">
                <p className="text-xs text-slate-500 mb-2">
                  아버지 {data.groom.parentAccounts.father.length > 1 && `(계좌 ${idx + 1})`}
                </p>
                <p className="text-sm md:text-base text-gray-800 font-medium mb-1">
                  {data.groom.fatherName || '아버지'}
                </p>
                <p className="text-xs md:text-sm text-gray-600">
                  {account.bank} {account.accountNumber}
                </p>
                <p className="text-xs text-gray-500">
                  예금주: {account.accountHolder}
                </p>
              </div>
            ))}

            {/* 어머니 계좌들 */}
            {data.groom.parentAccounts?.mother?.map((account, idx) => (
              <div key={`mother-${idx}`} className="p-4 md:p-5 bg-white rounded-xl shadow-sm border border-amber-100">
                <p className="text-xs text-slate-500 mb-2">
                  어머니 {data.groom.parentAccounts.mother.length > 1 && `(계좌 ${idx + 1})`}
                </p>
                <p className="text-sm md:text-base text-gray-800 font-medium mb-1">
                  {data.groom.motherName || '어머니'}
                </p>
                <p className="text-xs md:text-sm text-gray-600">
                  {account.bank} {account.accountNumber}
                </p>
                <p className="text-xs text-gray-500">
                  예금주: {account.accountHolder}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 신부 측 (동일 구조) */}
    </div>
  </section>
)}
```

### PreviewPanel 기본값 처리

```typescript
const previewData = useMemo(() => {
  return {
    // ...
    groom: {
      name: invitation.groom?.name || '신랑',
      fatherName: invitation.groom?.fatherName,
      motherName: invitation.groom?.motherName,
      // ...
      account: invitation.groom?.account,
      parentAccounts: invitation.groom?.parentAccounts || {
        father: [],
        mother: [],
      },
    },
    // ...
  };
}, [invitation]);
```

---

## Critical Files

### Phase 1 (필드명 버그 수정)
1. `schemas/invitation.ts` - AccountSchema 필드명 통일
2. `components/editor/tabs/AccountTab.tsx` - bankAccount → account 변경
3. `components/templates/ClassicTemplate.tsx` - number → accountNumber, holder → accountHolder
4. `components/editor/Sidebar.tsx` - 검증 로직 수정
5. `components/editor/PreviewPanel.tsx` - 기본값 처리 확인

### Phase 2 (부모님 계좌 추가)
1. `schemas/invitation.ts` - ParentAccountsSchema 추가
2. `components/editor/tabs/AccountTab.tsx` - 부모님 계좌 UI 추가
3. `components/templates/ClassicTemplate.tsx` - 부모님 계좌 렌더링 추가
4. `components/editor/PreviewPanel.tsx` - 부모님 계좌 기본값 처리

---

## 검증 방법

### Phase 1 검증
1. AccountTab에서 신랑/신부 계좌 입력
2. PreviewPanel에서 실시간으로 계좌 정보 표시 확인
3. ClassicTemplate에서 계좌 정보 제대로 렌더링되는지 확인
4. Sidebar에서 계좌 탭 완료 상태 확인 (체크 표시)

### Phase 2 검증
1. AccountTab에서 "부모님 계좌 관리" 버튼 클릭 → 섹션 확장
2. "아버지 계좌 추가" 클릭 → 새 계좌 폼 생성, 예금주 자동 입력 확인
3. 여러 개 계좌 추가 → 각각 독립적으로 수정/삭제 가능 확인
4. PreviewPanel에서 부모님 계좌 표시 확인
5. ClassicTemplate에서:
   - 본인 → 아버지들 → 어머니들 순서로 표시
   - 계좌 여러 개일 때 "(계좌 1)", "(계좌 2)" 라벨 표시
   - 빈 계좌는 자동 스킵

### E2E 테스트
1. 새 청첩장 생성
2. BasicInfoTab에서 신랑/신부 이름, 부모님 이름 입력
3. AccountTab에서:
   - 신랑 본인 계좌 1개
   - 신랑 아버지 계좌 2개
   - 신랑 어머니 계좌 1개
   - 신부 본인 계좌 1개
   - 신부 아버지 계좌 1개
   입력
4. PreviewPanel에서 모든 계좌 실시간 표시 확인
5. "새 탭에서 보기" 클릭 → ClassicTemplate에서 계좌 섹션 확인
6. 모바일/데스크톱 뷰 전환 → 레이아웃 확인

---

## 예상 소요 시간

- **Phase 1**: 1-2시간
  - Schema 수정: 10분
  - AccountTab 수정: 20분
  - ClassicTemplate 수정: 20분
  - Sidebar 수정: 10분
  - 테스트: 30분

- **Phase 2**: 3-4시간
  - Schema 확장: 20분
  - AccountTab UI 개선: 2시간
  - ClassicTemplate 렌더링: 1시간
  - PreviewPanel 수정: 20분
  - 테스트: 30분

**총 예상 시간**: 4-6시간
