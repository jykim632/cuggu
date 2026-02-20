# OMC (oh-my-claudecode) 사용 가이드

> Cuggu 프로젝트에서 OMC를 효율적으로 쓰기 위한 실전 가이드.
> 2026-02-20 기준 사용 현황 분석 후 작성.

---

## 1. 핵심 개념

OMC는 Claude Code 위에 얹힌 **멀티 에이전트 오케스트레이션 레이어**. 핵심 가치는 두 가지:

1. **전문 에이전트 위임** — 코드 작성, 리뷰, 디버깅, 보안 검토 등을 전담 에이전트에게 맡김
2. **자동화 루프** — 작업 → 검증 → 수정을 사람 개입 없이 반복

---

## 2. 세션 메모리 (컨텍스트 유지)

### 2-1. 노트패드

`/clear` 하거나 새 세션을 열어도 컨텍스트가 유지되는 메모 시스템.

| 섹션 | 용도 | 수명 | 용량 |
|------|------|------|------|
| **priority** | 현재 작업, 핵심 결정사항 | 수동 삭제 전까지 | 500자 |
| **working** | 작업 중 메모, 진행 상황 | 7일 후 자동 삭제 | 제한 없음 |
| **manual** | 영구 보존할 메모 | 영구 | 제한 없음 |

**사용법** — 자연어로 말하면 됨:

```
"지금 cuggu-upic 작업 중이야, 기억해"
→ priority 섹션에 저장

"shallow merge 이슈는 lodash.merge 대신 structuredClone + 수동 병합으로 하기로 했어, 노트해"
→ working 섹션에 저장

"이건 영구 메모로 저장해: Supabase 대시보드 비번은 1Password에 있음"
→ manual 섹션에 저장
```

**언제 쓰나?**
- 작업 시작할 때: 현재 이슈 ID + 접근 방식
- 중요 결정 내렸을 때: 왜 그 방식을 선택했는지
- 작업 중단할 때: 어디까지 했고 다음에 뭐 할지

### 2-2. 프로젝트 메모리 Directive

**모든 세션에서 자동으로 적용되는 영구 규칙**.

```
"앞으로 alert() 쓰지 말고 useToast 써"
→ directive로 저장, 이후 모든 코드 작성 시 자동 적용

"API route 인증은 항상 requireAuthUser 써"
→ high priority directive로 저장
```

**현재 등록된 directive:**
- `alert() 사용 금지 — 항상 useToast 훅 사용`
- `API route 인증은 반드시 requireAuthUser 헬퍼 사용`

**추가하면 좋을 것들:**
- "컴포넌트 색상은 stone 팔레트 통일" (cuggu-emny 관련)
- "이미지는 반드시 next/image 사용" (cuggu-ayy7 관련)
- "새 폼은 react-hook-form + zod 필수" (cuggu-3ozr 관련)

---

## 3. 단일 작업 처리

### 3-1. 에이전트 직접 위임

작업 성격에 따라 적절한 에이전트에게 맡기면 됨.

| 하고 싶은 일 | 말하는 방식 |
|-------------|-----------|
| 코드 검색/탐색 | "GalleryTab에서 이미지 업로드 로직 찾아줘" |
| 버그 분석 | "cuggu-ctcn TOCTOU 레이스 컨디션 분석해" |
| 코드 구현 | "requireAuthUser로 인증 코드 리팩터링해" |
| 코드 리뷰 | `/code-review` |
| 보안 점검 | `/security-review` |
| 빌드 에러 수정 | `/build-fix` |
| UI/UX 작업 | "RSVP 폼 모바일 반응형 개선해" |

### 3-2. MCP 도구 (외부 AI)

Claude 외에 Codex(GPT)와 Gemini도 쓸 수 있음.

```
"codex한테 이 아키텍처 리뷰 맡겨줘"
→ Codex(GPT)가 아키텍처 분석

"gemini한테 UI 리뷰 시켜줘"
→ Gemini(1M 컨텍스트)가 전체 컴포넌트 한번에 분석
```

**Codex 강점**: 아키텍처 리뷰, 계획 검증, 코드/보안 리뷰
**Gemini 강점**: UI/UX 리뷰, 문서 작성, 대량 파일 분석 (1M 토큰)

---

## 4. 자동화 모드 (핵심)

### 4-1. `/ralph` — 완료까지 루프

**가장 추천하는 모드**. 작업 → 검증 → 수정을 자동 반복. architect가 검증.

```
/ralph "cuggu-upic console.log 개인정보 노출 전부 제거"
/ralph "cuggu-g9f5 에디터 로드 실패 시 fake 데이터 자동저장 방지"
```

**적합한 작업**: 범위가 명확한 버그 수정, 단일 기능 리팩터링

### 4-2. `/ultrawork` — 병렬 실행

여러 독립적인 작업을 동시에 처리.

```
/ultrawork "P0 버그 수정: cuggu-upic, cuggu-aktz, cuggu-gka8"
```

**적합한 작업**: 서로 의존성 없는 여러 이슈를 한번에 처리

### 4-3. `/team` — 팀 협업

plan → exec → verify → fix 파이프라인으로 돌아가는 풀 팀.

```
/team "결제 시스템 구현 (cuggu-ae6 → p7b → 0jo → atb → 005 → 03e)"
```

**적합한 작업**: 의존성 체인이 있는 대규모 피처, 여러 파일 동시 수정

### 4-4. `/autopilot` — 완전 자율

아이디어만 주면 설계부터 구현, 검증까지 전부 자동.

```
/autopilot "loading.tsx, error.tsx, not-found.tsx 전체 라우트에 추가"
```

**적합한 작업**: 반복적이지만 범위가 넓은 작업

### 4-5. `/plan` — 설계 먼저

복잡한 작업 전에 architect + planner가 설계안 작성.

```
/plan "Zustand 셀렉터 미사용 문제 해결 방안"
/ralplan "결제 시스템 아키텍처"  (planner + architect + critic 합의까지)
```

**적합한 작업**: 여러 접근법이 가능한 아키텍처 결정

---

## 5. Cuggu 프로젝트 추천 워크플로우

### P0 버그 일괄 처리

```
# 독립적인 P0 버그들을 병렬로
/ultrawork "P0 버그 수정: console.log 개인정보(upic), Zustand 타이머 누수(aktz), FallingPetals 랜덤값(gka8)"
```

### 결제 시스템 구현 (의존성 체인)

```
# 설계 합의부터
/ralplan "PortOne 결제 시스템 아키텍처 — DB 마이그레이션부터 프론트엔드까지"

# 승인 후 팀 모드로 실행
/team "결제 시스템 구현"
```

### 일상 작업 루틴

```
1. 세션 시작 → "오늘 할 일: cuggu-xxxx, 기억해"
2. 작업 → /ralph "이슈 설명"
3. 완료 → "bd close cuggu-xxxx"
4. 커밋 전 → /code-review
5. 세션 끝 → "오늘 여기까지, 내일은 cuggu-yyyy 할 거야"
```

### 코드 품질 일괄 개선

```
# 리뷰 먼저
/code-review

# 발견된 이슈를 ultrawork로 일괄 수정
/ultrawork "alert→useToast 교체(32mz), invitation:any 타입 수정(ewzc), loading.tsx 추가(n2yj)"
```

---

## 6. 모드 선택 가이드

```
단일 버그/기능 (명확한 범위)     → /ralph
독립적 이슈 여러 개              → /ultrawork
의존성 있는 큰 피처              → /team
아키텍처 결정 필요               → /plan 또는 /ralplan
전부 맡기고 싶음                 → /autopilot
빠른 리뷰만                     → /code-review, /security-review
```

---

## 7. 자주 쓸 명령어 요약

| 명령 | 용도 |
|------|------|
| `"기억해"` / `"노트해"` | 노트패드에 컨텍스트 저장 |
| `"앞으로 OO 해"` / `"OO 하지 마"` | 프로젝트 메모리 directive 추가 |
| `/ralph "작업 설명"` | 완료까지 자동 루프 |
| `/ultrawork "작업들"` | 병렬 처리 |
| `/team "큰 작업"` | 팀 파이프라인 |
| `/plan "설계 주제"` | 설계 먼저 |
| `/code-review` | 코드 리뷰 |
| `/cancel` | 실행 중인 모드 중단 |
| `bd ready` | 작업 가능한 이슈 확인 |
| `bd close ID` | 이슈 완료 처리 |
