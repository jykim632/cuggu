# 2026-02-09 | AI 테마 생성 + 미리보기 뷰 모드

> 브랜치: develop
> 커밋: 6fd15bf (미리보기), AI 테마 미커밋

---

## 작업한 내용

### 작업 1: 미리보기 페이지 뷰 모드 선택기

에디터 "미리보기" 버튼이 `/inv/{id}` (공개 페이지)를 열던 걸 `/preview/{id}` 전용 페이지로 분리.
Desktop / Mobile Web / Phone Preview 3가지 뷰 모드 전환 가능.

**공통 컴포넌트 추출:**
- `PhoneFrame.tsx` — iPhone/Galaxy CSS 프레임 (PreviewPanel에서 65줄 인라인 코드 추출)
- `PreviewViewport.tsx` — 3모드(desktop/mobile/phone) 뷰포트 렌더러
- `get-template.ts` — `getTemplateComponent()` 공통 유틸 (PreviewPanel, InvitationView 중복 제거)

**프리뷰 라우트:**
- `app/preview/[id]/page.tsx` — 서버 컴포넌트 (DB 조회, 권한 체크만. 조회수 증가/비밀번호 게이트 없음)
- `app/preview/[id]/PreviewClient.tsx` — 클라이언트 (툴바 + 모드 전환 + localStorage 저장)

**헤더 중앙정렬**: `flex justify-between` → `grid grid-cols-[1fr_auto_1fr]`로 변경해서 모드 버튼 그룹이 우측 컨트롤 유무와 관계없이 항상 중앙 고정.

### 작업 2: AI 테마 생성 파이프라인

SerializableTheme 리팩토링(이전 세션)을 기반으로, Claude API로 커스텀 테마를 생성하는 전체 파이프라인 구현.

**Phase 1 — Zod 스키마 + Safelist:**
- `schemas/theme.ts` — SerializableTheme 전체 Zod 미러링. 6개 빌트인 테마 전부 통과 확인
- `lib/templates/safelist.ts` — 빌트인 클래스 자동 추출 + 22개 색상 팔레트 확장 (13,545 클래스)
- `tailwind.config.ts` — safelist 연결

**Phase 2 — Claude API:**
- `lib/ai/theme-prompt.ts` — 시스템 프롬프트 (디자인 규칙, 필드 역할, classic/floral 예시 테마 포함)
- `lib/ai/theme-generation.ts` — `tool_use` + `tool_choice` 강제 → Zod parse → safelist 검증 → 반환
- `@anthropic-ai/sdk 0.74.0` 설치

**Phase 3 — API 엔드포인트:**
- `app/api/ai/theme/route.ts` — auth, rate limit (10/hr), 크레딧 차감(1), 실패 시 환불

**Phase 4 — 상태 관리 + DB:**
- `schemas/invitation.ts` — `customTheme` 필드 추가 (InvitationSchema + ExtendedDataSchema)
- `lib/invitation-utils.ts` — customTheme DB 매핑 양방향

**Phase 5 — UI + 프리뷰:**
- `TemplateTab.tsx` — AI 테마 생성 섹션 (textarea + 생성 버튼 + 로딩 + 활성 표시)
- `PreviewPanel.tsx` — `templateId === 'custom'` 분기 → BaseTemplate 직접 렌더링
- `InvitationView.tsx`, `PreviewClient.tsx` — 공개/미리보기 페이지에서도 customTheme 렌더링

---

## 왜 했는지

- **미리보기 분리**: 에디터에서 "미리보기" 누르면 공개 페이지가 열려서 조회수 올라가고, 비밀번호 게이트도 걸림. 편집자 전용 프리뷰가 필요했음
- **AI 테마**: SerializableTheme 리팩토링이 끝나서 "AI가 JSON만 뱉으면 바로 렌더링" 가능한 상태. 핵심 차별화 포인트인 AI 기능을 사진 생성에서 테마 생성으로 확장

---

## 논의/고민

### safelist 크기
13,545 클래스는 많다. gzip 후 실제 CSS 증가분은 크지 않을 수 있지만 `next build`로 확인 필요.
대안: 색상을 10개로 줄이면 ~7,000개. 실제 빌드 테스트 후 판단.

### customTheme 타입
`z.any().optional()`로 넣었는데, 보안 리뷰 문서에서 지적한 대로 저장 시점에 Zod + safelist 검증을 추가해야 함 (현재는 API 엔드포인트에서만 검증). 직접 PUT으로 customTheme을 주입하는 공격 벡터 존재.

### Claude 모델 선택
Sonnet 4.5 사용. 테마 JSON 생성은 ~1.5K 토큰 출력이라 비용 ~$0.003/req. Haiku도 고려했지만 디자인 감각이 필요한 작업이라 Sonnet 선택.

---

## 결정된 내용

| 항목 | 결정 |
|------|------|
| AI 호출 방식 | Claude `tool_use` + `tool_choice` 강제 (JSON 구조 보장) |
| 스키마 변환 | Zod v4 `toJSONSchema()` → tool input_schema 직접 전달 |
| safelist 전략 | 빌트인 자동 추출 + 색상 팔레트 확장 + AI 프롬프트 제한 (이중 방어) |
| DB 저장 | extendedData JSONB의 `customTheme` 키 (마이그레이션 불필요) |
| 빌트인/커스텀 전환 | `templateId: 'custom'` + `customTheme` 유무로 분기 |
| rate limit | 10회/시간/유저 |
| 크레딧 | 1 크레딧/생성, 실패 시 환불 |

---

## 난이도/발견

- **Zod v4 JSON Schema**: `zod/v4/json-schema` 경로가 아니라 메인 `zod`에서 직접 `toJSONSchema` export. 문서가 v3 기준이라 삽질
- **tool_use 타입**: Anthropic SDK의 `ContentBlock` union에서 tool_use 블록 추출할 때 타입 가드 필요
- **PreviewPanel 리팩토링**: 65줄의 인라인 폰 프레임 CSS가 PhoneFrame 컴포넌트로 깔끔하게 분리. PreviewPanel 134줄 → ~80줄 감소
- **grid 중앙정렬**: `justify-between`은 양쪽 요소 크기에 따라 중앙이 밀림. `grid-cols-[1fr_auto_1fr]`이 정답

---

## 검증 상태

- [x] `tsc --noEmit` — 새 파일 에러 0
- [x] 6개 빌트인 테마 Zod 스키마 통과
- [x] 6개 빌트인 테마 safelist 검증 통과
- [ ] `.env.local` ANTHROPIC_API_KEY 설정
- [ ] 실제 AI 생성 E2E 테스트
- [ ] `next build` CSS 번들 사이즈 확인

---

## 남은 것 / 다음 액션

1. **API 키 설정 + E2E 테스트**: `.env.local`에 `ANTHROPIC_API_KEY` 추가 → 에디터에서 실제 생성 테스트
2. **CSS 번들 확인**: `next build` 전후 CSS 크기 비교, safelist 축소 여부 판단
3. **보안 강화**: PUT API에서 customTheme 직접 주입 방어 (Zod + safelist 검증 추가)
4. **에러 UX**: rate limit 초과, 크레딧 부족, safelist 검증 실패 시 사용자 친화적 메시지
5. **AI 테마 미커밋 상태** — 테스트 후 커밋 필요
6. **beads 이슈**: AI 테마 생성 이슈 생성 + 완료 처리

---

## 데이터 흐름 요약

```
사용자 프롬프트 (TemplateTab)
  → POST /api/ai/theme { prompt }
  → auth → rate limit (10/hr) → credit 차감 (1)
  → Claude Sonnet 4.5 tool_use
  → Zod parse → safelist 검증
  → { theme: SerializableTheme }
  → updateInvitation({ templateId: 'custom', customTheme })
  → PreviewPanel → BaseTemplate(theme=customTheme)
  → 자동저장 → extendedData.customTheme (JSONB)
```

---

## 파일 변경 전체 목록

### 새로 생성 (10개)
```
components/ui/PhoneFrame.tsx
components/preview/PreviewViewport.tsx
lib/templates/get-template.ts
app/preview/[id]/page.tsx
app/preview/[id]/PreviewClient.tsx
schemas/theme.ts
lib/templates/safelist.ts
lib/ai/theme-prompt.ts
lib/ai/theme-generation.ts
app/api/ai/theme/route.ts
```

### 수정 (8개)
```
tailwind.config.ts              — safelist 추가
schemas/invitation.ts           — customTheme 필드
lib/invitation-utils.ts         — customTheme DB 매핑
components/editor/PreviewPanel.tsx   — 공통 컴포넌트 + custom 분기
components/editor/TopBar.tsx         — /preview URL
components/editor/tabs/TemplateTab.tsx — AI 생성 UI
app/inv/[id]/InvitationView.tsx      — 공통 유틸 + custom 분기
app/preview/[id]/PreviewClient.tsx   — custom 분기
```

### 의존성
```
+ @anthropic-ai/sdk 0.74.0
```
