# 2026-02-06 템플릿 리팩토링

## 작업한 내용

6개 청첩장 템플릿(Classic, Modern, Minimal, Floral, Elegant, Natural)의 72% 중복 코드를 제거하는 대규모 리팩토링.

**생성한 파일:**
- `lib/templates/themes.tsx` - TemplateTheme 타입 + 6개 테마 정의 (502줄)
- `components/templates/BaseTemplate.tsx` - 섹션 오케스트레이터 (64줄)
- `components/templates/sections/` - 7개 공유 섹션 컴포넌트
  - GreetingSection, ParentsSection, CeremonySection, MapInfoSection, GallerySection, AccountsSection, RsvpSectionWrapper

**결과:**
- 각 템플릿: ~550줄 → ~100줄 (커버 + 푸터만 유지)
- 전체: ~3,300줄 → 1,763줄 (-47%)
- 새 섹션 추가: 6개 파일 수정 → 1개 파일 수정

## 왜 했는지

새 섹션(D-Day 카운터, 엔딩, 방명록 등) 추가할 때마다 6개 파일을 동일하게 수정해야 하는 상황. 실수 가능성 높고, 템플릿 간 미세한 불일치 발생 위험. 확장성의 병목.

## 논의/아이디어/고민

### 테마 props 설계가 핵심 난이도
- 처음에 가이드 문서의 TemplateTheme으로 시작했으나, 실제 6개 템플릿을 전부 읽어보니 가이드에 빠진 차이점 다수 발견
- **Elegant/Minimal/Natural**: 부모 섹션에 "Groom"/"Bride" 상단 라벨 존재 (가이드 미반영)
- **Minimal 예식 섹션**: 완전히 다른 레이아웃 (아이콘 중앙, 카드 없음) → `ceremonyCentered` 플래그 추가
- **인사말 장식**: top/bottom 분리 필요 (Classic은 top만, Floral/Elegant/Natural은 양쪽)
- **Minimal 계좌**: 신랑/신부 사이 고유 구분선 → `accountsDivider` 추가

### theme.id 체크 vs 추가 props 고민
CeremonySection에서 카드 내부 텍스트 색상이 템플릿마다 달라서 처음에 `theme.id === 'modern' ? ...` 패턴으로 작성. 아키텍처적으로 나쁘다고 판단해서 `cardLabelClass`, `cardValueClass`, `cardSubTextClass` 등 7개 props 추가. theme.id 체크는 최소화(Minimal 안내사항 divider, Classic map tel 정도).

### ReactNode 주입 패턴
디바이더, 커스텀 헤딩, 장식 요소를 ReactNode로 테마에 주입. themes.tsx가 .tsx여야 하는 이유. SSR 영향 없음 (사용처가 전부 "use client" 컴포넌트).

## 결정된 내용

- **커버/푸터는 템플릿에 유지**: 각 템플릿의 정체성이므로 추출하지 않음
- **바디 섹션만 공유 컴포넌트로**: greeting~rsvp 7개 섹션
- **테마는 순수 Tailwind 리터럴**: 동적 클래스 조합 금지 (purge 안전성)
- **Minimal은 별도 레이아웃**: `ceremonyCentered` 플래그로 분기

## 느낀 점/난이도/발견

- **난이도**: 중상. 코드 자체는 단순하지만, 6개 템플릿의 미세한 차이를 정확히 파악하는 게 시간 소모의 80%.
- **발견**: 가이드 문서가 꽤 잘 작성되어 있었지만, 실제 코드를 전부 읽어야 빠진 부분이 보임. 설계 문서만 믿고 구현하면 안 됨.
- **TemplateTheme이 40+ props**: 많아 보이지만 각 props가 1:1로 Tailwind 클래스 매핑이라 유지보수는 간단. IDE 자동완성으로 충분히 관리 가능.

## 남은 것/미정

- [ ] **비주얼 검증**: 6개 템플릿 모두 공개 청첩장 페이지에서 렌더링 확인 필요 (dev 서버)
- [ ] **MapInfoSection의 theme.id 체크 2개**: Classic map tel, Minimal transport divider - 더 나은 추상화 가능
- [ ] **CeremonySection의 Minimal notice divider**: theme.id === 'minimal' 체크 남아있음
- [ ] **향후 새 섹션 추가 시 검증**: D-Day, 엔딩 크레딧 등 실제 추가해보며 1-file-change 목표 달성 확인

## 다음 액션

1. `npm run dev`로 6개 템플릿 비주얼 확인
2. 문제 있으면 테마 props 미세 조정
3. 확인 완료 후 main 머지

## 서랍메모

- Minimal 템플릿은 다른 5개와 철학이 달라서 추상화가 가장 어려움. 향후 템플릿 추가 시 "카드 기반" vs "텍스트 기반" 분류를 먼저 하면 좋을 듯.
- `themes.tsx`의 헬퍼 컴포넌트들(FloralDecor, ElegantDiamondDecor 등)은 나중에 데코레이션 라이브러리로 분리할 수 있음.
- 계좌 섹션이 150줄로 가장 큰 공유 컴포넌트. AccountCard 서브컴포넌트로 잘 분리했지만, 복사 기능 추가 시 더 커질 수 있음.

## 내 질문 평가 및 피드백

사용자가 가이드 문서를 먼저 제공한 게 효율적이었음. 다만 "작업 진행해보자"라는 지시가 범위가 넓어서, 실제로는 가이드 전체를 한 번에 구현하는 대작업이 됨. 중간 체크포인트(예: Classic 1개만 먼저 마이그레이션 → 확인 → 나머지 진행)를 제안했으면 리스크 관리가 더 좋았을 것. 결과적으로 한 번에 성공했지만, 비주얼 검증 전까지는 확신할 수 없는 상태.
