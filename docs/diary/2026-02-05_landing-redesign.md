# 2026-02-05 랜딩 페이지 리디자인

## 작업한 내용

사업계획서 기반으로 랜딩 페이지 전면 리디자인 완료.

**새로 만든 컴포넌트 (7개)**:
- `components/landing/HeroImpact.tsx` - 메인 히어로 + 꽃잎 애니메이션
- `components/landing/BeforeAfterGallery.tsx` - 탭 기반 Before/After 슬라이더
- `components/landing/ProblemSolution.tsx` - 비용 비교 테이블
- `components/landing/HowItWorks.tsx` - 3단계 프로세스
- `components/landing/SecurityTrust.tsx` - 보안 기능 (다크 배경)
- `components/landing/SocialProof.tsx` - 후기/통계
- `components/landing/FinalCTA.tsx` - 마지막 전환 유도

**수정한 파일**:
- `app/(marketing)/page.tsx` - 새 8섹션 구조로 교체
- `components/layout/Header.tsx` - fixed position, blur 효과, 모바일 메뉴
- `components/marketing/Pricing.tsx` - 비교 배지 추가, rose 색상 통일

## 왜 했는지 (맥락)

기존 랜딩 페이지 문제:
- Hero → Features → Pricing 단순 3섹션 구조
- AI 사진 생성의 "와우" 모먼트를 시각적으로 못 보여줌
- Before/After, 실제 결과물 데모 없음

사업계획서의 핵심 차별화 포인트:
- "증명사진 1장 → AI 웨딩 화보 4장" (2-3분)
- 50-200만원 웨딩 촬영 → 9,900원 가격 파괴
- 보안 특화 (피싱 1,189% 증가 대응)

## 논의/아이디어/고민

**사용자 선택 사항**:
- 목표: 전환율 극대화 (브랜드 인지도, 기능 설명 중심 아님)
- AI 데모: Before/After 갤러리 (인터랙티브 데모는 복잡도 높음)
- 스타일: 감성적/로맨틱 (모던 미니멀, 임팩트 스타일 아님)

**재사용한 기존 컴포넌트**:
- `ScrollFade.tsx` - 스크롤 fade-in 애니메이션
- `BeforeAfter.tsx` (landing-c) - 슬라이더 로직 참고
- `FallingPetals.tsx` - Hero 배경용 (인라인으로 재구현)

## 결정된 내용

**페이지 흐름 (8섹션)**:
```
HeroImpact → BeforeAfterGallery → ProblemSolution → HowItWorks
→ SecurityTrust → SocialProof → Pricing → FinalCTA
```

**색상**:
- pink-500 → rose-500/600 통일 (감성적/로맨틱)
- Security 섹션만 다크 (slate-900)

**Header**:
- fixed position + 스크롤 시 blur 배경
- 모바일 햄버거 메뉴 추가

## 느낀 점/난이도/발견

**난이도**: 중간
- 컴포넌트 7개 신규 생성이지만 패턴이 비슷해서 빠르게 진행
- 기존 ScrollFade, BeforeAfter 로직 재사용으로 시간 단축

**발견**:
- landing-a/b/c 페이지에 이미 좋은 컴포넌트들이 있었음 (ScrollFade, FallingPetals 등)
- Header를 fixed로 바꾸면 Hero에 pt-16 필요

## 남은 것/미정

- [ ] 이미지 에셋: 현재 unsplash 플레이스홀더 → 실제 AI 생성 결과물 교체 필요
- [ ] FallingPetals 성능: 모바일에서 테스트 필요 (꽃잎 개수 조절)
- [ ] A/B 테스트: 기존 landing-a/b/c와 전환율 비교
- [ ] Sticky CTA: 모바일 하단 고정 버튼 (선택)

## 다음 액션

1. 실제 AI 생성 결과물 이미지 준비 (S3 업로드)
2. 모바일 실기기 테스트
3. Lighthouse 성능 점수 확인 (목표 90+)
4. main 브랜치에 머지

## 서랍메모

- 사업계획서 위치: `cuggu-business-plan.md`, `docs/business-plan.md`
- 디자인 문서: `docs/landing-redesign.md`
- 브랜치: `feature/landing-redesign`
- 커밋: `f4af2bd`

---

## 내 질문 평가 및 피드백

**잘한 점**:
- "사업계획서 기반으로" 명확한 방향 제시
- 브랜치 따고 시작하라는 지시 (깔끔한 워크플로우)
- Header 누락 지적 (꼼꼼한 리뷰)

**개선 가능한 점**:
- 이미지 에셋 방향을 미리 정해두면 좋았을 것 (플레이스홀더 vs 실제 이미지)
- 모바일 우선 vs 데스크톱 우선 명시하면 더 빠른 의사결정 가능
