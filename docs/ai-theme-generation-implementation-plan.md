# AI 테마 생성 기능 구현 계획

## Context

SerializableTheme 리팩토링 완료로 모든 테마가 100% JSON-serializable. Claude API에 테마 생성을 시킬 수 있는 기반이 마련됨. TemplateTab에 AI 테마 생성 UI를 추가하여 사용자가 텍스트 프롬프트로 커스텀 테마를 만들 수 있게 한다.

## 핵심 데이터 흐름

```
사용자 프롬프트 입력 (TemplateTab)
    → POST /api/ai/theme
    → Claude API (tool_use → SerializableTheme JSON)
    → Zod 파싱 + Safelist 검증
    → Zustand store에 customTheme 저장
    → PreviewPanel이 BaseTemplate에 직접 전달
    → 자동저장 → extendedData.customTheme으로 DB 저장
```

## 구현 순서

### Phase 1: Zod 스키마 + Safelist 기반

**1-1. `schemas/theme.ts` — SerializableTheme Zod 스키마**
- `lib/templates/types.ts`의 인터페이스를 Zod 스키마로 미러링
- `DividerConfigSchema`, `DecorationConfigSchema`, `HeadingConfigSchema`, `AnimationConfigSchema`, `CoverConfigSchema`, `FooterConfigSchema`, `SerializableThemeSchema`
- Zod v4이므로 `zod/v4/json-schema`의 `toJsonSchema()` 사용 (별도 패키지 불필요)
- 검증: 기존 6개 빌트인 테마가 스키마 통과하는지 확인

**1-2. `lib/templates/safelist.ts` — Tailwind safelist + 검증**
- 기존 6개 테마에서 사용하는 모든 클래스 자동 추출
- 웨딩에 적합한 색상 팔레트 확장 (rose, amber, emerald, stone, zinc, slate, pink, teal, purple, indigo, sky 등)
  - `text-{color}-{50..900}`, `bg-{color}-{50..900}`, `border-{color}-{50..900}`
  - 그라디언트: `from-`, `via-`, `to-` 변형
  - opacity: `/{20,30,50,70,80}` 변형
- `THEME_SAFELIST: string[]` export (tailwind.config용)
- `validateThemeClasses(theme): void` — 모든 string 필드를 순회하여 safelist에 없는 클래스 검출 시 에러

**1-3. `tailwind.config.ts` 수정**
- `safelist: THEME_SAFELIST` 추가

### Phase 2: Claude API 연동

**2-1. `@anthropic-ai/sdk` 설치**

**2-2. `lib/ai/theme-prompt.ts` — 시스템 프롬프트**
- 역할: 웨딩 청첩장 테마 디자이너
- 디자인 규칙 (색상 조화, 가독성, 한국 웨딩 미학)
- 각 필드가 UI에서 어떤 역할인지 설명
- 기존 테마 2-3개를 예시로 포함 (classic, modern)
- **허용된 Tailwind 클래스 목록 전체 포함** → 이 목록 밖 사용 금지 명시
- ~2-3K 토큰 이내

**2-3. `lib/ai/theme-generation.ts` — 생성 파이프라인**
```typescript
export async function generateTheme(userPrompt: string): Promise<SerializableTheme>
```
- Claude Sonnet `tool_use` + `tool_choice: { type: 'tool', name: 'create_wedding_theme' }`
- Zod v4 `toJsonSchema(SerializableThemeSchema)` → tool input_schema
- 응답에서 tool_use 블록 추출 → `SerializableThemeSchema.parse()` → `validateThemeClasses()` → 반환
- 실패 시 명확한 에러 메시지

### Phase 3: API 엔드포인트

**3-1. `app/api/ai/theme/route.ts`**
- `POST` — auth 체크, rate limit (`ratelimit:ai-theme:{userId}`, 10/hour), credit 체크/차감 (1 크레딧)
- 입력: `{ prompt: string }` (2-200자)
- 응답: `{ success: true, theme: SerializableTheme }` 또는 `{ error: string }`
- 생성 실패 시 크레딧 환불
- 기존 `lib/ai/rate-limit.ts`, `lib/ai/credits.ts` 패턴 재사용

### Phase 4: 상태 관리 + DB 저장

**4-1. `stores/invitation-editor.ts` 수정**
- `updateInvitation({ templateId: 'custom', customTheme: generatedTheme })` 호출로 통합
- 자동저장 시 `customTheme`이 `extendedData`에 포함되어 저장됨

**4-2. `schemas/invitation.ts` — ExtendedDataSchema 수정**
- `customTheme: z.any().optional()` 추가

**4-3. `lib/invitation-utils.ts` 수정**
- `invitationToDbUpdate()`: `data.customTheme` → `extendedData.customTheme`
- `dbRecordToInvitation()`: `ext.customTheme` → `invitation.customTheme`

### Phase 5: UI + 프리뷰

**5-1. `components/editor/tabs/TemplateTab.tsx` 수정**
- 무료 템플릿 그리드 아래에 "AI 테마 생성기" 섹션 추가
- 텍스트 입력 (textarea) + "AI 테마 생성" 버튼 (1 크레딧 표시)
- 로딩 상태 (shimmer/spinner, ~3-5초 예상)
- 성공 시: 자동으로 프리뷰 반영, 커스텀 테마가 선택된 상태로 표시
- 에러 시: 에러 메시지 표시
- 커스텀 테마 활성 시 "다시 만들기" 버튼
- 빌트인 템플릿 클릭하면 customTheme 해제되고 해당 템플릿으로 전환

**5-2. `components/editor/PreviewPanel.tsx` 수정**
- `getTemplateComponent()` 앞에 커스텀 테마 분기:
  ```typescript
  if (templateId === 'custom' && invitation.customTheme) {
    return <BaseTemplate data={previewData} theme={invitation.customTheme} isPreview />;
  }
  ```

**5-3. 공개 뷰 수정 (있다면)**
- `app/inv/[id]/` 쪽에서도 동일하게 `customTheme` 분기 처리

### Phase 6: 환경 변수

- `.env.local`에 `ANTHROPIC_API_KEY` 추가
- `lib/ai/env.ts`에 optional로 추가 (기존 배포 안 깨지게)
- API 엔드포인트에서 런타임 체크

## 수정 파일 목록

| 파일 | 변경 |
|------|------|
| `schemas/theme.ts` | **신규** — SerializableTheme Zod 스키마 |
| `lib/templates/safelist.ts` | **신규** — Tailwind safelist + validateThemeClasses |
| `lib/ai/theme-prompt.ts` | **신규** — Claude 시스템 프롬프트 |
| `lib/ai/theme-generation.ts` | **신규** — Claude API 호출 + 검증 파이프라인 |
| `app/api/ai/theme/route.ts` | **신규** — POST 엔드포인트 |
| `tailwind.config.ts` | safelist 추가 |
| `stores/invitation-editor.ts` | customTheme 상태 관리 |
| `schemas/invitation.ts` | ExtendedDataSchema에 customTheme 추가 |
| `lib/invitation-utils.ts` | customTheme DB 매핑 |
| `components/editor/tabs/TemplateTab.tsx` | AI 생성 UI 추가 |
| `components/editor/PreviewPanel.tsx` | custom 테마 프리뷰 분기 |

## DB 마이그레이션

**없음** — `extendedData` JSONB 컬럼에 `customTheme` 키 추가만으로 충분

## 검증 방법

1. 기존 6개 테마가 새 Zod 스키마 통과 확인
2. safelist에 기존 테마의 모든 클래스 포함 확인
3. AI 생성 테마로 에디터 프리뷰 정상 렌더링 확인
4. 빌트인 ↔ 커스텀 전환 시 프리뷰/저장 정상 동작 확인
5. `next build` 후 CSS 번들 사이즈 비교 (safelist 추가 전후)
