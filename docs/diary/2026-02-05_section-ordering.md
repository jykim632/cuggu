# 개발 일지: 청첩장 섹션 순서 변경 기능

**날짜:** 2026-02-05
**브랜치:** `feature/section-ordering`
**beads:** cuggu-3ha, cuggu-9ik, cuggu-52c, cuggu-9ci (모두 closed)

---

## 작업한 내용

청첩장 내 섹션(인사말, 가족정보, 예식정보, 갤러리, 계좌)의 표시 순서를 사용자가 변경할 수 있는 기능 구현.

**변경 파일:**
| 파일 | 변경 내용 |
|------|----------|
| `schemas/invitation.ts` | sectionOrder 필드, 상수, sanitize 함수 추가 |
| `lib/invitation-utils.ts` | DB 매핑에 sectionOrder 추가 (1줄) |
| `components/editor/tabs/SettingsTab.tsx` | 섹션 순서 변경 UI (위/아래 버튼) |
| `components/templates/ClassicTemplate.tsx` | 동적 섹션 렌더링 |
| `components/templates/ModernTemplate.tsx` | 동적 섹션 렌더링 + 디바이더 |
| `components/templates/FloralTemplate.tsx` | 동적 섹션 렌더링 |
| `components/templates/MinimalTemplate.tsx` | 동적 섹션 렌더링 + 디바이더 |
| `components/editor/PreviewPanel.tsx` | useMemo 의존성 수정 |

---

## 왜 했는지 (맥락)

사용자가 청첩장 섹션 순서를 커스터마이징하고 싶다는 요구. 기존에는 4개 템플릿 모두 동일한 하드코딩된 순서로 고정되어 있었음.

---

## 논의/아이디어/고민

### 1. UI 선택: 드래그앤드롭 vs 버튼
- dnd-kit은 Phase 2 기능으로 예정되어 있음
- 현재는 위/아래 화살표 버튼으로 구현 (의존성 추가 없음)
- 추후 dnd-kit 추가 시 데이터 모델(sectionOrder: string[])은 그대로 유지 가능

### 2. 지도 섹션 처리
- 설계 문서에는 5개 섹션만 있었는데, 실제 코드에는 지도(map) 섹션도 있었음
- **결정:** ceremony 섹션 내부로 통합 (지도는 예식 정보의 일부)

### 3. 디바이더 처리
| 템플릿 | 디바이더 |
|--------|----------|
| Classic | 없음 |
| Floral | 없음 |
| Modern | 수평선 (섹션 간) |
| Minimal | 수직선 (섹션 간) |

→ Modern/Minimal은 `renderSections()` 함수로 visible 섹션 간 디바이더 삽입

### 4. 비활성 섹션 UX
- 숨김/비어있는 섹션도 리스트에 표시 (회색 + 상태 노트)
- 이유: 나중에 활성화했을 때 사용자가 설정한 위치 유지

---

## 결정된 내용

- **고정 섹션:** 커버(첫 번째), 푸터(마지막)
- **재정렬 가능:** greeting, parents, ceremony, gallery, accounts
- **저장 위치:** `extendedData.settings.sectionOrder` (JSONB)
- **하위 호환:** `sectionOrder`가 undefined면 `DEFAULT_SECTION_ORDER` 사용
- **정합성 보장:** `sanitizeSectionOrder()` 함수로 누락/중복/잘못된 ID 방어

---

## 느낀 점/난이도/발견

**난이도: 중간**
- 스키마/DB 변경은 간단 (JSONB라 마이그레이션 불필요)
- 템플릿 리팩토링이 가장 작업량 많음 (4개 파일, 각 400줄+)
- 패턴은 동일해서 기계적 작업

**발견:**
- ClassicTemplate에 console.log가 남아있었음 (지도 디버깅용)
- PreviewPanel의 useMemo가 `[invitation]` 전체를 의존성으로 가짐
  - 세분화 필요: `[invitation.settings, invitation.groom, ...]`
- 미리보기 실시간 반영 이슈 발견 → useMemo 의존성 수정

---

## 남은 것/미정

- [ ] 미리보기 실시간 반영 테스트 필요
- [ ] 다른 설정 변경 시 미리보기 반영되는지 확인 (비교 테스트)
- [ ] main 브랜치로 머지

---

## 다음 액션

1. 로컬에서 섹션 순서 변경 테스트
2. 미리보기 반영 이슈 확인 및 추가 수정
3. main으로 머지

---

## 커밋 로그

```
ba16a71 feat: 청첩장 섹션 순서 변경 기능 구현
7aa07ab fix: PreviewPanel useMemo 의존성 세분화 - 실시간 미리보기 반영 개선
```
