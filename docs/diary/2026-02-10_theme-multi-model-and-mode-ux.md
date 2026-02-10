# AI 테마 생성 — 멀티 모델 + 빠른/정밀 모드

> 날짜: 2026-02-10
> 선행: `2026-02-09_ai-theme-generation.md`, `2026-02-09_theme-multi-model.md`

---

## 작업한 내용

하루에 2단계 작업 완료:

**Phase 1: 멀티 모델 인프라**
- 테마 생성을 Claude Sonnet 하드코딩에서 3개 프로바이더(Anthropic/OpenAI/Gemini) 팩토리 패턴으로 확장
- 6개 신규 파일: 모델 레지스트리, 프로바이더 인터페이스/구현체 3개, 팩토리
- DB `aiThemes`에 `modelId` 컬럼 추가 + 마이그레이션
- `generateTheme(prompt, model)` 시그니처로 리팩토링

**Phase 2: UX 개선 (빠른/정밀 모드)**
- Admin: 토글 6개 → **라디오 그룹 2개** (빠른 생성 모델 / 정밀 생성 모델)
- API: `modelId` → `mode: 'fast' | 'quality'` param, `appSettings` 기반 설정 조회
- Editor: **세그먼트 컨트롤** (⚡ 빠른 생성 ~2초 / ✨ 정밀 생성 ~5초)
- 크레딧 동일 (1), 차별은 속도+품질로

---

## 왜 했는지

- Gemini Flash가 Claude 대비 **25배 저렴** ($0.002 vs $0.049) → 비용 최적화 필수
- 기존 Admin UI (토글 6개)가 직관적이지 않고 실수 유발
- 사용자에게 모델 선택권을 주되, 기술적 디테일은 숨기고 싶었음

---

## 논의/아이디어/고민

### 4관점 리뷰 실시 (PM, 고객, 백엔드, 사장)

**파이프라인 vs 직접 호출** — 가장 큰 논쟁점

원래 아이디어: Gemini로 초안 → Claude로 검증/개선 (2단계 파이프라인)

4관점 모두에서 반대 의견이 강했음:
- **PM**: 품질 차이 미검증 상태에서 구현하면 위험. "기본/고급" 네이밍이 "기본=열등" 프레이밍
- **고객**: 결혼 준비 중 결정 피로 극심. 선택지 추가가 부담. 원하는 건 "빠르게 예쁜 결과 + 재시도"
- **백엔드**: latency 2배(4.5~9초), 부분 실패 크레딧 처리 복잡, "검증+개선" 프롬프트가 오히려 결과를 망칠 가능성
- **사장**: 마진 97%→25% 하락, 디버깅 경로 2배, 1인 운영에서 치명적

**"기본/고급" 네이밍 문제**

청첩장은 인생에 한 번. "기본"이라는 단어가 주는 열등감이 크다.
→ "빠른 생성 / 정밀 생성"으로 결정. 속도 차이가 중립적 차별 포인트.

**크레딧 차등 (1 vs 2) 검토**

고급이 2크레딧이면 무료 크레딧(2개)이 한 번에 소진 → 이탈 위험.
→ 동일 1크레딧으로 결정. 비용 차이는 운영자가 마진으로 흡수.

---

## 결정된 내용

| 항목 | 결정 |
|------|------|
| 고급 모드 구현 | 파이프라인 X, 직접 호출 (모델만 다르게) |
| 네이밍 | "빠른 생성" / "정밀 생성" |
| 크레딧 | 동일 1크레딧 |
| Admin UI | 라디오 그룹 (모드별 모델 선택) |
| User UI | 세그먼트 컨트롤 (기본값: 빠른 생성) |
| 설정 저장소 | `appSettings` 테이블 (마이그레이션 불필요) |
| 기본값 | 빠른=Gemini Flash, 정밀=Claude Sonnet |

---

## 난이도/발견

**난이도**: 중간

인프라 자체는 사진 생성 패턴(providers/factory)이 이미 있어서 따라가면 됐음. 진짜 어려웠던 건 **무엇을 만들지 결정하는 것**.

**발견 1: Gemini JSON Schema 호환성**
`toJSONSchema()`가 draft-2020-12를 생성하는데 Gemini가 `$schema` 키워드를 못 읽음 → `stripUnsupportedKeys()` 유틸 추가

**발견 2: OpenAI SDK v6 타입**
`ChatCompletionMessageToolCall`이 union 타입(`FunctionToolCall | CustomToolCall`)이라 `.function` 접근 시 타입 에러 → `toolCall.type !== 'function'` 가드 필요

**발견 3: Gemini FunctionCallingConfigMode**
`mode: 'ANY'` 문자열이 안 먹고 `FunctionCallingConfigMode.ANY` enum을 import해야 함

---

## 아키텍처

```
사용자 → 세그먼트 선택 (fast/quality)
  ↓
POST /api/ai/theme { prompt, mode }
  ↓
resolveThemeModel(mode)
  → appSettings.theme_generation_config 조회
  → mode === 'quality' ? qualityModelId : fastModelId
  → findThemeModelById() → AIThemeModel
  ↓
generateTheme(prompt, model)
  → getThemeProvider(model.providerType)
  → provider.generateTheme({ systemPrompt, userPrompt, jsonSchema, model })
  → sanitizeEnums(rawJson) → Zod parse → cost 계산
  ↓
DB insert (modelId, cost, tokens 포함)
```

### 비용 구조

| 모델 | 비용/생성 | 마진률 (크레딧 100원 기준) |
|------|---------|----------------------|
| Gemini Flash (빠른) | ~$0.002 (~3원) | 97% |
| GPT-4o | ~$0.034 (~50원) | 50% |
| Claude Sonnet (정밀) | ~$0.049 (~72원) | 28% |

---

## 파일 변경 목록

### 신규 (7개)
| 파일 | 내용 |
|------|------|
| `lib/ai/theme-models.ts` | 모델 레지스트리, ThemeMode, ThemeGenerationConfig, DEFAULT_THEME_CONFIG |
| `lib/ai/theme-providers/types.ts` | ThemeProvider 인터페이스, ThemeProviderResult |
| `lib/ai/theme-providers/anthropic.ts` | Claude tool_use 구현 |
| `lib/ai/theme-providers/openai.ts` | OpenAI function calling 구현 |
| `lib/ai/theme-providers/gemini.ts` | Gemini functionDeclarations + JSON Schema strip |
| `lib/ai/theme-providers/index.ts` | getThemeProvider() 팩토리 |
| `db/migrations/0005_ai_theme_model_id.sql` | modelId 컬럼 추가 |

### 수정 (5개)
| 파일 | 변경 |
|------|------|
| `lib/ai/theme-generation.ts` | Anthropic 직접 호출 → 프로바이더 디스패치, ThemeGenerationResult에 modelId+cost |
| `db/schema.ts` | aiThemes에 modelId varchar(64) |
| `app/api/ai/theme/route.ts` | modelId → mode param, resolveThemeModel(mode), appSettings 기반 |
| `app/api/admin/ai-models/route.ts` | themeConfig GET/PATCH, theme_config 타입 분기 |
| `app/admin/ai-models/page.tsx` | 토글 리스트 → 라디오 그룹 2개 |

### UI 추가 (1개)
| 파일 | 변경 |
|------|------|
| `components/editor/tabs/TemplateTab.tsx` | 세그먼트 컨트롤 (빠른/정밀), mode state, API에 mode 전달 |

---

## 남은 것 / 미정

- [ ] **마이그레이션 실행**: `0005_ai_theme_model_id.sql` (배포 시)
- [ ] **A/B 품질 비교**: 동일 프롬프트 30개로 Gemini vs Claude 결과물 비교 → 데이터 기반 기본 모델 결정
- [ ] **부분 수정 기능**: "색상만 바꿔줘", "폰트만 세리프로" — 고객 관점에서 가장 가치 높은 기능
- [ ] **파이프라인 재검토**: 품질 데이터 축적 후 (1~2개월)

---

## 다음 액션

1. 마이그레이션 실행 후 Gemini Flash로 실제 테마 생성 테스트
2. Admin에서 빠른=Gemini, 정밀=Claude 설정 확인
3. 에디터에서 두 모드 전환 시 체감 차이 확인

---

## 서랍메모

- 사진 생성 providers 패턴이 잘 만들어져 있어서 테마도 동일하게 확장하니 깔끔했음. 팩토리 패턴의 힘.
- 4관점 리뷰가 생각보다 유용했음. 특히 "고객 관점에서 결정 피로"라는 지적이 네이밍 변경과 크레딧 단일화를 이끌어냄.
- Gemini가 $0.002면 10번 재생성해도 Claude 1번보다 저렴. "다시 만들기" UX를 강화하는 게 파이프라인보다 나은 전략일 수 있음.
- 디자인 리뷰 문서를 별도로 작성함: `docs/diary/2026-02-10_theme-mode-design-review.md`

---

## 내 질문 평가 및 피드백

사용자의 초기 요구사항은 "고급모드 파이프라인 + 관리자 순서 설정 + 사용자 기본/고급 선택"이었는데, 4관점 리뷰를 통해 **파이프라인 → 직접 호출**, **기본/고급 → 빠른/정밀**, **크레딧 차등 → 동일**로 방향이 바뀜.

사용자가 "다양한 관점에서 검토해봐, team을 만들어서"라고 요청한 덕분에 단순 구현이 아닌 **제품 설계 관점의 의사결정**이 이뤄졌고, 결과적으로 더 단순하고 운영 가능한 구조가 나왔음. 좋은 질문이었음.
