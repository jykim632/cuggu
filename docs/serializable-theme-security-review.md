# SerializableTheme + AI 테마 생성 보안 검토

> 작성일: 2026-02-06
> 대상 문서: serializable-theme-ai-generation-guide.md
> 상태: 구현 전 사전 검토

---

## 요약

아키텍처 자체는 안전한 편. React의 텍스트 이스케이프 + Tailwind 유틸리티 클래스 특성상 XSS/HTML 인젝션 리스크는 낮다. 핵심 리스크는 **검증 우회 경로**와 **safelist 검증 누락**.

---

## 1. customTheme 직접 주입 방어 (Critical)

### 문제

AI 생성 파이프라인(`POST /api/ai/theme`)은 Zod + safelist 검증을 거치지만, 청첩장 수정 API(`PATCH /api/invitations/[id]`)에서 `extendedData.customTheme`을 직접 설정할 수 있으면 검증을 우회할 수 있다.

### 대응

```
방법 A (추천): 저장 시점 검증
  - 청첩장 update API에서 extendedData.customTheme이 존재하면
    동일한 SerializableThemeSchema + validateThemeClasses() 적용
  - 검증 실패 시 customTheme 필드 무시 또는 400 응답

방법 B: 쓰기 경로 분리
  - customTheme은 오직 /api/ai/theme 엔드포인트에서만 설정 가능
  - 청첩장 update API에서는 customTheme 필드를 strip (Zod .omit() 또는 수동 제거)
```

**방법 A가 현실적.** 향후 사용자가 수동으로 테마를 편집하는 UI가 추가될 가능성이 있으므로, 저장 시점에서 항상 검증하는 게 확장성 있다.

---

## 2. safelist 검증 구현 (High)

### 문제

`validateThemeClasses()`가 SerializableTheme의 모든 string 필드를 재귀적으로 순회해야 한다. 빠뜨리기 쉬운 중첩 필드:

```
cover.gradient.stops        # "from-transparent via-white/50 to-white"
cover.invitationLabel.class # "text-xs tracking-[0.3em] ..."
cover.ampersandDecoration   # DividerConfig 내부의 colorClass, marginClass 등
footer.containerClass       # string
sectionBg                   # Record<string, string> 값들
```

### 대응

```typescript
// 구현 시 검증 로직 요구사항:
// 1. 재귀적으로 모든 string 값 추출 (중첩 객체, 배열 포함)
// 2. 각 string을 공백으로 split → 개별 클래스 단위로 safelist 체크
// 3. safelist에 없는 클래스 발견 시 해당 필드명과 클래스 로깅 + 거부
// 4. 예외: content, text, subLabel 등 Tailwind가 아닌 텍스트 필드는 별도 처리

function extractAllClasses(theme: SerializableTheme): Map<string, string[]> {
  // fieldPath → classes[] 매핑 반환
  // 텍스트 필드(content, text, subLabel 등)는 제외
}
```

**테스트 필수:** 6개 빌트인 테마를 `validateThemeClasses()`에 통과시켜서 false positive 없는지 확인.

---

## 3. 텍스트 필드 제약 (Medium)

### 문제

`DecorationConfig.content`, `HeadingConfig.text`, `HeadingConfig.subLabel` 등은 React 텍스트 노드로 렌더링되므로 XSS는 없다. 하지만 길이/내용 제한이 없으면:
- 매우 긴 문자열 → 레이아웃 깨짐
- 부적절한 내용 삽입 가능 (공개 URL이므로)

### 대응

Zod 스키마에서 제약:

```
content:  z.string().max(10)              # 이모지/심볼 전용 (🌸, ❀, ◇ 등)
text:     z.string().max(30)              # 섹션 제목 ("Gallery", "오시는 길" 등)
subLabel: z.string().max(20)              # 소제목 라벨 ("Moments", "Gift" 등)
```

AI 시스템 프롬프트에서도 "content 필드는 이모지 또는 1~2글자 심볼만 사용" 명시.

---

## 4. AI 프롬프트 인젝션 (Medium)

### 문제

사용자 입력 프롬프트("다크 럭셔리 골드")가 Claude API로 직접 전달된다. 악의적 프롬프트로 시스템 프롬프트를 무시시키려는 시도 가능.

### 대응

이미 구조적으로 방어됨:
- `tool_choice: { type: 'tool', name: 'create_wedding_theme' }` → JSON 스키마 강제
- Zod 후처리 검증 → 스키마 벗어나는 출력 거부
- safelist 검증 → 허용 클래스 외 거부

추가 권장:
- 사용자 프롬프트 길이 제한: `z.string().min(2).max(200)`
- 로깅: 프롬프트 + 생성 결과 기록 (악용 패턴 모니터링)

---

## 5. 비용 남용 (Low)

### 문제

레이트 리밋(10회/일)이 있지만, 다수 계정 생성으로 우회 가능.

### 대응

- 카카오 로그인 기반이라 계정 생성 비용이 있어서 대규모 남용은 어려움
- 일별 전체 API 호출 상한 설정 권장 (예: 전체 500회/일)
- Upstash Redis에 글로벌 카운터 추가

---

## 6. 안전한 부분 (참고)

| 항목 | 이유 |
|------|------|
| className XSS | React가 className을 문자열 attribute로 이스케이프. HTML 인젝션 불가 |
| Tailwind 클래스 | 유틸리티 CSS만 생성. 임의 스타일(`style` attribute) 아님 |
| API 키 노출 | 서버사이드 전용 (Route Handler). 클라이언트 번들에 포함 안 됨 |
| DB 인젝션 | Drizzle ORM 파라미터 바인딩. JSONB 저장이므로 SQL 인젝션 없음 |

---

## 구현 시 체크리스트

```
[ ] customTheme 저장 시 SerializableThemeSchema + safelist 검증
[ ] validateThemeClasses() 재귀 구현 + 텍스트 필드 예외 처리
[ ] 텍스트 필드(content, text, subLabel) 길이 제한
[ ] 사용자 프롬프트 길이 제한 (max 200자)
[ ] 빌트인 6개 테마 validateThemeClasses() 통과 테스트
[ ] API 호출 로깅 (프롬프트 + 결과)
[ ] 글로벌 일별 API 호출 상한
```
