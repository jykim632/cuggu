# 테마 생성 멀티 모델 지원 — 설계 문서

> 날짜: 2026-02-09
> 브랜치: `feat/ai-theme-generation`
> 선행 작업: `2026-02-09_admin-ai-menu-restructure.md`

---

## 배경

현재 테마 생성은 `lib/ai/theme-generation.ts`에서 Claude Sonnet(`claude-sonnet-4-5-20250929`) 하드코딩.

사진 생성은 이미 멀티 모델 구조가 갖춰져 있음:
- `AI_MODELS` 레지스트리 + `GenerationProvider` 인터페이스 + 프로바이더 팩토리
- Replicate / OpenAI / Gemini 3개 프로바이더
- `aiModelSettings` DB로 enable/recommend 관리, API에서 `modelId`로 디스패치

OpenAI(`openai: ^6.18.0`)와 Gemini(`@google/genai: ^1.40.0`) SDK가 이미 설치·사용 중이라, 테마 생성도 같은 패턴으로 확장 가능.

---

## 모델 비교

| 모델 | 프로바이더 | Input $/MTok | Output $/MTok | 예상 비용/생성 | 품질 | 속도 |
|------|-----------|-------------|--------------|--------------|------|------|
| Claude Sonnet 4.5 | Anthropic | $3.00 | $15.00 | ~$0.018 | 우수 | 보통 |
| GPT-4o | OpenAI | $2.50 | $10.00 | ~$0.015 | 양호 | 빠름 |
| Gemini 2.5 Flash | Google | $0.15 | $0.60 | ~$0.001 | 양호 | 빠름 |

Gemini Flash가 10~20배 저렴. 테마 품질은 실제 테스트 후 판단 필요.

---

## 아키텍처

```
POST /api/ai/theme { prompt, modelId? }
    ↓
theme-generation.ts  generateTheme(prompt, modelId?)
    ↓
theme-models.ts      findThemeModelById(modelId) → AIThemeModel
    ↓
theme-providers/     getThemeProvider(providerType) → ThemeProvider
    ├── anthropic.ts   Claude tool_use
    ├── openai.ts      OpenAI function calling
    └── gemini.ts      Gemini functionDeclarations
    ↓
theme-generation.ts  sanitizeEnums() → Zod parse → { theme, usage, cost }
    ↓
DB insert            aiThemes (modelId 포함)
```

### 프로바이더 공통 전략

3개 프로바이더 모두 **function calling / tool use** 방식으로 통일:
- 입력: system prompt + user prompt + JSON Schema (from `toJSONSchema(SerializableThemeSchema)`)
- 출력: raw JSON → `sanitizeEnums()` → `SerializableThemeSchema.parse()` → `ThemeGenerationResult`

| 프로바이더 | SDK 메서드 | 결과 추출 |
|-----------|-----------|----------|
| Anthropic | `messages.create({ tools, tool_choice })` | `content[].tool_use.input` |
| OpenAI | `chat.completions.create({ tools, tool_choice })` | `choices[0].message.tool_calls[0].function.arguments` (JSON string → parse) |
| Gemini | `models.generateContent({ tools, toolConfig })` | `functionCalls()[0].args` |

---

## 타입 정의

```typescript
// lib/ai/theme-models.ts
export type ThemeProviderType = 'anthropic' | 'openai' | 'gemini';

export interface AIThemeModel {
  id: string;                      // 'theme-claude-sonnet'
  name: string;                    // 'Claude Sonnet 4.5'
  provider: string;                // 'Anthropic'
  providerType: ThemeProviderType;
  providerModel: string;           // 'claude-sonnet-4-5-20250929'
  inputCostPerMToken: number;      // $/MTok
  outputCostPerMToken: number;
  description: string;
  quality: 'excellent' | 'good' | 'fair';
  speed: 'fast' | 'medium' | 'slow';
}

// lib/ai/theme-providers/types.ts
export interface ThemeProvider {
  generateTheme(params: {
    prompt: string;
    systemPrompt: string;
    jsonSchema: object;
    providerModel: string;
  }): Promise<{
    rawJson: unknown;
    inputTokens: number;
    outputTokens: number;
  }>;
}
```

비용 계산 (오케스트레이터에서):
```typescript
const cost = (usage.inputTokens * model.inputCostPerMToken
            + usage.outputTokens * model.outputCostPerMToken) / 1_000_000;
```

---

## DB 변경

`aiThemes` 테이블에 `modelId` 컬럼 추가:

```sql
-- db/migrations/0005_ai_theme_models.sql
ALTER TABLE ai_themes
  ADD COLUMN model_id varchar(64) DEFAULT 'theme-claude-sonnet';
```

기존 레코드는 모두 Claude로 생성됐으므로 default 적합.

---

## 파일 변경 목록

| 파일 | 액션 | 내용 |
|------|------|------|
| `lib/ai/theme-models.ts` | **신규** | `AIThemeModel` 타입, `AI_THEME_MODELS` 레지스트리, 헬퍼 함수 |
| `lib/ai/theme-providers/types.ts` | **신규** | `ThemeProvider` 인터페이스 |
| `lib/ai/theme-providers/anthropic.ts` | **신규** | Claude tool_use (기존 코드 추출) |
| `lib/ai/theme-providers/openai.ts` | **신규** | OpenAI function calling |
| `lib/ai/theme-providers/gemini.ts` | **신규** | Gemini functionDeclarations |
| `lib/ai/theme-providers/index.ts` | **신규** | `getThemeProvider()` 팩토리 |
| `lib/ai/theme-generation.ts` | 수정 | `generateTheme(prompt, modelId?)` 프로바이더 디스패치 |
| `db/schema.ts` | 수정 | `aiThemes.modelId` 컬럼 추가 |
| `db/migrations/0005_ai_theme_models.sql` | **신규** | ALTER TABLE |
| `app/api/ai/theme/route.ts` | 수정 | `modelId` 지원, 모델별 비활성화 체크, cost 개선 |
| `app/api/admin/ai-models/route.ts` | 수정 | `themeModels` 배열 반환, 멀티 모델 PATCH |
| `app/admin/ai-models/page.tsx` | 수정 | 테마 탭 모델 카드 리스트 |

---

## 하지 않는 것

- 유저 UI에서 모델 선택 드롭다운 (기본 추천 모델 사용, 추후 추가)
- 영상 생성 구현 (placeholder 유지)
- 테마 히스토리에 모델별 필터 (데이터 쌓인 후)

---

## 작업 순서

1. `lib/ai/theme-models.ts` — 모델 레지스트리
2. `lib/ai/theme-providers/` — 프로바이더 5파일 (types, anthropic, openai, gemini, index)
3. `lib/ai/theme-generation.ts` — 리팩토링 (프로바이더 디스패치)
4. `db/schema.ts` + migration — modelId 컬럼
5. `app/api/ai/theme/route.ts` — modelId 지원
6. `app/api/admin/ai-models/route.ts` — 멀티 테마 모델 API
7. `app/admin/ai-models/page.tsx` — 테마 탭 모델 카드 UI
8. `tsc --noEmit` 타입 체크

---

## 검증 체크리스트

- [ ] `/admin/ai-models` 테마 탭 → 3개 모델 카드, enable/recommend 토글
- [ ] `POST /api/ai/theme` modelId 없이 → 추천 모델로 생성
- [ ] `POST /api/ai/theme` `{ modelId: 'theme-gpt-4o' }` → OpenAI로 생성
- [ ] 비활성화된 모델로 요청 → 403
- [ ] DB `aiThemes.modelId`에 사용된 모델 ID 저장 확인
- [ ] TypeScript 빌드 에러 없음
