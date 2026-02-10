# 에디터 온보딩 퀵 위자드 구현

> 날짜: 2026-02-10
> 이슈: cuggu-qj7
> 브랜치: feature/editor-onboarding → develop 머지 완료

---

## 작업한 내용

신규 청첩장 생성 시 에디터 첫 진입에 3단계 모달 위자드 추가.

- **Step 1**: 템플릿 선택 (6개 빌트인, 2x3 그리드)
- **Step 2**: 신랑/신부 이름 입력
- **Step 3**: 예식 날짜 + 예식장 이름

완료 후 데이터가 Zustand store에 반영되어 자동저장. 위자드 다시 안 뜸.

### 변경 파일
- `components/editor/OnboardingWizard.tsx` — 신규 생성 (~250줄)
- `app/editor/[id]/page.tsx` — 위자드 마운트 + 판별 로직
- `components/editor/tabs/TemplateTab.tsx` — `TemplateMiniPreview`, `BUILTIN_TEMPLATES` export 분리
- `schemas/invitation.ts` — `extendedData.onboardingCompleted` 필드 추가

## 왜 했는지

기존 플로우: "첫 청첩장 만들기" → 플레이스홀더("신랑/신부/예식장") 상태로 8탭 에디터에 바로 던져짐.
"뭘 먼저 해야 하지?" → 이탈 위험. P1 이슈로 분류됨 (improvement-priority-roadmap 참고).

## 논의/결정

- **A. 퀵 위자드 vs B. 가이드 오버레이**: A 선택. 플레이스홀더 혼란이 가장 큰 이탈 요인이라 실제 데이터를 먼저 수집하는 게 효과적.
- **첫 진입 판별**: `extendedData.onboardingCompleted` 플래그 + `isNewWithDefaults()` 휴리스틱 조합. 기존 초대장에 위자드가 뜨지 않도록 backward compat 보장.
- **완료 후 이동 탭**: 처음엔 `basic` 탭으로 갔으나, 테스트 후 `template` 탭으로 변경. 위자드에서 고른 템플릿을 에디터에서 바로 확인할 수 있게.
- **건너뛰기**: `onboardingCompleted` 플래그만 설정. 플레이스홀더 유지.

## 기술 메모

- `TemplateMiniPreview`가 TemplateTab 안에 private function이었는데 export로 변경. `BUILTIN_TEMPLATES` 배열도 상수로 분리.
- Framer Motion `AnimatePresence` + custom direction으로 스텝 간 좌우 슬라이드 전환.
- `?onboarding=1` 쿼리 파라미터로 기존 초대장에서도 위자드 강제 표시 가능 (디버그용).
- DB 마이그레이션 불필요 — `extendedData` JSONB 필드에 optional 키 추가만.

## 난이도/발견

- 난이도: 소~중. 컴포넌트 하나 + 기존 코드 약간 수정.
- worktree 환경에서 `.env.local` 심볼릭 링크 필요했음.
- `useSearchParams`가 Next.js 16에서 Suspense boundary 없이도 동작함 확인.
- develop 브랜치가 다른 워크트리에서 사용 중이라 `git update-ref`로 fast-forward 머지함.

## 남은 것

- 프로덕션 배포 전 `?onboarding=1` 디버그 파라미터 제거 검토 (남겨도 무해하긴 함)
- 모바일 에디터(cuggu-iji) 구현 시 위자드 모바일 대응 필요
- 위자드 단계에 AI 테마 생성 안내를 넣을지 (현재는 빌트인만)

## 다음 액션

- `bd ready`로 다음 작업 확인
- Phase 1 나머지: 실시간 검증(cuggu-6oh), 저장 실패 알림(cuggu-j1v) 등
