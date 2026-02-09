# 에디터 사이드바 → 섹션 패널 UI 개선

**날짜**: 2026-02-06
**브랜치**: `feature/editor-section-panel`
**난이도**: 중 (UI 리팩토링 + 상태 연동, 구조는 단순)

## 작업한 내용

64px 아이콘 전용 사이드바(Figma 스타일)를 220px 섹션 패널로 교체하고, 선택 섹션에 토글 on/off 기능을 추가했다.

### 변경 파일
| 파일 | 변경 |
|------|------|
| `lib/editor/tabs.ts` | `description`, `toggleable`, `group` 필드 + `DEFAULT_ENABLED_SECTIONS` 상수 |
| `schemas/invitation.ts` | `ExtendedDataSchema`에 `enabledSections`, `InvitationSchema`에 `extendedData` 추가 |
| `stores/invitation-editor.ts` | `toggleSection`, `getEnabledSections` 액션 |
| `components/editor/SectionPanel.tsx` | **신규** — Sidebar 대체. 아이콘+텍스트+설명+토글 |
| `components/editor/StepNavigation.tsx` | 비활성 섹션 스킵 로직 |
| `components/templates/BaseTemplate.tsx` | `enabledSections` 기반 섹션 렌더링 필터 |
| `app/editor/[id]/page.tsx` | `Sidebar` → `SectionPanel` 교체 |

## 왜 했는지

- 아이콘만으로는 신규 사용자가 뭔지 모름. 호버 툴팁이 있긴 한데 모바일 대응 안 되고, 처음 들어오면 뭘 클릭해야 하는지 감이 안 잡힘
- 청첩장 특성상 인사말/갤러리/계좌를 전부 쓰지 않는 커플이 많음. 섹션 on/off 없으면 빈 섹션이 미리보기에 그대로 노출됨
- Figma 스타일 사이드바는 디자인 도구에나 맞는 UX. 타겟 사용자(일반 커플)에게는 과한 미니멀리즘

## 논의/아이디어/고민

- **사이드바 유지 vs 교체**: 사이드바를 넓히는 것도 고려했지만, 그룹핑+토글 넣으려면 어차피 전면 교체가 깔끔
- **패널 위치**: 좌측(기존 위치) vs 우측(미리보기 옆). 좌측이 자연스러운 읽기 흐름이라 좌측 선택
- **선택 섹션 기본값**: 전부 켜짐 / 전부 꺼짐 / 인사말+갤러리만. 전부 켜짐으로 결정 — 불필요한 건 사용자가 끄는 게 낫다
- **토글 off 시 데이터 보존**: 끄면 미리보기에서만 숨기고 에디터 데이터는 유지. 다시 켜면 복원됨
- **account ↔ accounts 네이밍 불일치**: 탭 ID는 `account`, BaseTemplate의 sectionId는 `accounts`. `isSectionEnabled()` 헬퍼에서 매핑 처리

## 결정된 내용

- 220px 좌측 섹션 패널, 그룹핑(템플릿/필수/선택/설정)
- 선택 섹션: 인사말, 갤러리, 계좌 → 토글 스위치
- 기본값: 전부 켜짐
- 저장: `extendedData.enabledSections`에 저장 (DB 마이그레이션 불필요)
- StepNavigation 유지 (패널 + 이전/다음 버튼 병행)
- Switch 컴포넌트: shadcn 의존 안 하고 Tailwind로 직접 구현

## 느낀 점/발견

- `extendedData` JSONB 컬럼이 이런 확장에 딱 맞음. 스키마 마이그레이션 없이 새 기능 붙이기 좋다
- 기존 BaseTemplate의 `.filter(({ node }) => node !== null)` 패턴 덕분에 토글 off → `return null`만 추가하면 자연스럽게 필터링됨. 설계가 잘 되어 있었음
- `InvitationSchema`에 `extendedData`가 빠져 있어서 타입 에러 발생 → 추가 수정. DB에는 있는데 Zod 스키마에 없었던 케이스

## 남은 것/미정

- [ ] 실제 브라우저에서 UI 검증 (토글 애니메이션, 반응형 등)
- [ ] 토글 off 상태에서 해당 탭 클릭 시 UX (현재는 접근 가능하되 opacity 50%)
  - 아예 클릭 불가로 할지, 경고 메시지를 보여줄지 미정
- [ ] 기존 `Sidebar.tsx` 파일 삭제 타이밍 (다른 곳에서 참조하지 않는지 확인 후)
- [ ] 모바일/태블릿 대응 — 현재는 데스크톱 레이아웃만 고려

## 다음 액션

1. 브라우저에서 섹션 패널 + 토글 동작 확인
2. Sidebar.tsx 정리 (삭제 or 보류)
3. Gemini API 연동 작업 이어가기 (multi-provider-ai 브랜치)

## 서랍메모

- 토글 UI를 직접 만들었는데, 나중에 다른 곳에서도 쓸 것 같으면 `components/ui/Switch.tsx`로 분리해도 됨
- 섹션 순서 변경(drag & drop)도 같은 패널에서 할 수 있으면 좋겠는데, 이건 별도 작업으로

## 내 질문 평가 및 피드백

- "사이드바 없애고 select 메뉴 영역 만드는 게 나으려나?" → 좋은 방향 제시. 구체적인 형태(드롭다운 vs 패널)는 논의를 통해 패널로 수렴됨
- Gemini API 언급은 이 작업과 별개지만, multi-provider 브랜치 맥락에서 자연스러운 전환이었음
