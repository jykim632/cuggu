# Week 7 (2/9 ~ 2/15) - 주간 작업 계획

## 지난주 성과 요약 (Week 6)

- 6개 템플릿 공유 섹션 추출 + SerializableTheme 리팩토링 (`cuggu-cul` 진행중)
- AI 이미지 생성 멀티 프로바이더 지원 (OpenAI, Gemini 추가)
- 에디터 사이드바 → 섹션 패널 UI 개선
- 카카오톡 SDK 공유 기능 완료
- 공개 청첩장 뷰 전체 완료 (6개 템플릿, 지도, 길찾기)
- 네이버 로그인 추가
- Admin AI 모델 관리 시스템

---

## 프로젝트 현황

| 구분 | 수 |
|------|-----|
| 완료 | 25 |
| 진행중 | 3 |
| 대기(open) | 20 |
| 블로커 대기 | 5 |

---

## 이번주 핵심 목표

> **cuggu-cul 완료 → 블로커 4개 해제 → P1 커스터마이징 기능 연타**

---

## 1. 최우선: 블로커 해제 (월~화)

### `cuggu-cul` 템플릿 리팩토링 완료 [in_progress, P1]
- 공유 섹션 컴포넌트 추출 마무리
- 이거 끝나야 아래 4개가 시작 가능:
  - `cuggu-4rv` 폰트 선택 시스템
  - `cuggu-jrt` D-Day 달력 위젯
  - `cuggu-erp` 엔딩 섹션
  - `cuggu-bpa` 커스텀 OG 이미지

### `cuggu-9t6` 편집기 구현 마무리 [in_progress, P1]
- 이미 대부분 구현됨, 최종 정리 및 안정화

---

## 2. P1 기능 구현 (화~목)

cuggu-cul 완료 후 순서대로 진행. 경쟁사 대비 '심각' 격차 항목들.

### `cuggu-jrt` D-Day 달력 위젯 [P1, blocked→ready]
- calendar / countdown / minimal 3가지 스타일
- 순수 React, 외부 라이브러리 없음
- 예상: 0.5일

### `cuggu-4rv` 폰트 선택 시스템 [P1, blocked→ready]
- 6종 한글 폰트 + 3단계 크기
- next/font 최적 로딩
- 예상: 0.5일

### `cuggu-erp` 엔딩 섹션 [P1, blocked→ready]
- 사진 + 마무리 문구
- 고정 위치 (푸터 바로 위)
- 예상: 0.5일

### `cuggu-bpa` 커스텀 OG 공유 이미지 [P1, ready]
- generateMetadata() 커스텀 값 우선 적용
- 예상: 0.5일

---

## 3. P1 독립 작업 (목~금)

블로커 없이 바로 시작 가능한 P1 이슈들.

### `cuggu-rqq` 다양한 가족 형태 지원 [P1, ready]
- 한부모/고인/익명 표기
- DB 스키마 수정 (JSONB)
- BasicInfoTab UI + 템플릿 렌더링
- 예상: 1일

### `cuggu-qka` 청첩장 목록 페이지 [P1, ready]
- /dashboard/invitations 목록 UI
- 카드 레이아웃, 상태 뱃지, 통계
- CRUD API 이미 완료 (cuggu-ave)
- 예상: 0.5일

### `cuggu-8vc` 결제 시스템 (Toss Payments) [P1, ready]
- 프리미엄 플랜 9,900원
- AI 크레딧 추가 구매
- 예상: 1~1.5일 (이번주 착수, 다음주 마무리 가능)

---

## 4. 여유 있으면 (P2)

| ID | 이슈 | 비고 |
|----|------|------|
| `cuggu-s2k` | 방명록 구현 | 별도 테이블, 레이트 리밋 |
| `cuggu-3f3` | 갤러리 슬라이드 | embla-carousel |
| `cuggu-9xi` | NextAuth sessions 분리 | 동작은 정상, 스키마 정리 |
| `cuggu-3pb` | 실제 서비스 연동 테스트 | Replicate/Azure/AWS E2E |
| `cuggu-6zb` | 에러 케이스 테스트 | 6가지 에러 시나리오 |

---

## 5. 새로 추가 검토할 작업

지난주 작업에서 파생된 항목들:

| 항목 | 설명 | 우선순위 |
|------|------|---------|
| AI 테마 생성 UI | SerializableTheme 기반, Claude API tool_use | P1 (docs/ai-theme-generation-implementation-plan.md 참고) |
| 멀티 프로바이더 테스트 | OpenAI/Gemini 이미지 생성 실제 테스트 | P2 |
| 에디터 섹션 패널 QA | 리디자인된 UI 모바일 검증 | P2 |

---

## 주간 일정 요약

| 요일 | 작업 |
|------|------|
| **월** | `cuggu-cul` 리팩토링 완료, `cuggu-9t6` 편집기 안정화 |
| **화** | `cuggu-jrt` D-Day 위젯, `cuggu-4rv` 폰트 시스템 |
| **수** | `cuggu-erp` 엔딩 섹션, `cuggu-bpa` OG 이미지 |
| **목** | `cuggu-rqq` 가족 형태 지원, `cuggu-qka` 목록 페이지 |
| **금** | `cuggu-8vc` 결제 시스템 착수 + 버퍼/리뷰 |

---

## 리스크

- **cuggu-cul이 늦어지면** → 화~수 일정 전부 밀림. 월요일 집중 필수.
- **결제 시스템 (Toss)** → 사업자 등록/API 키 발급 선행 필요. 미리 확인.
- **AI 테마 생성** → 이번주 이슈 생성만 해두고, 다음주 착수가 현실적.
