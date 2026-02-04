# AI 사진 생성 Feature 완료 및 Main 머지 (2026-02-04)

## 작업한 내용

### feature/ai-photo-generation 브랜치 마무리
- 마지막 커밋 `e4b6beb`: 다중 AI 모델 지원 + 신랑/신부 구분 생성
- `main` 브랜치로 Fast-forward 머지 완료
- 총 33개 파일, +8,434줄 / -40줄이 main에 반영됨

### 이 브랜치에서 완료된 전체 작업 (6 커밋)
```
e4b6beb feat: 다중 AI 모델 지원 및 신랑/신부 구분 생성
9a4683f feat: AI 사진 생성 Frontend 구현
d711f0d test: AI 사진 생성 시스템 Mock 테스트 추가
6c91270 refactor: 코드 리뷰 개선 제안 6개 구현
8ed8f16 fix: 코드 리뷰 중요 이슈 5개 수정
9dd2fd6 fix: 코드 리뷰 크리티컬 이슈 5개 수정
f301647 feat: AI 사진 생성 시스템 구현
```

---

## 왜 했는지 (맥락)

- AI 사진 생성은 Cuggu의 핵심 차별화 기능
- Backend(Phase 1) → Code Review → Frontend → 모델 확장 순서로 진행
- 이번 세션에서 마지막 변경 커밋 후 main 머지로 feature 브랜치 작업 종료

---

## 논의/아이디어/고민

### 모델 사용 중 Sonnet vs Opus
- 이번 세션에서 Sonnet 4.5 → Opus 4.5로 전환
- 코드 리뷰, 설계 판단, 복잡한 리팩터링에는 Opus가 유리
- 단순 작업(커밋, 파일 수정)은 Sonnet으로도 충분

### 머지 전략
- ephemeral 브랜치 (upstream 없음) → local merge to main
- Fast-forward 가능해서 충돌 없이 깔끔하게 머지됨
- push는 안 함 (로컬 개발 환경)

---

## 결정된 내용

### AI 사진 생성 시스템 최종 구성
| 레이어 | 구성 | 파일 수 |
|--------|------|---------|
| Backend API | generate, generations, select, credits | 4개 |
| AI Core | replicate, face-detection, s3, rate-limit, models | 5개 |
| Infra | env, constants, logger | 3개 |
| Frontend | page, uploader, style, progress, gallery, model selector | 6개 |
| Test | generate.test, credits.test | 2개 |
| Types | types/ai.ts | 1개 |
| **합계** | | **21개 코드 파일** |

### 검증된 AI 모델 (3개)
| 모델 | 비용/장 | 얼굴 보존 | 용도 |
|------|---------|-----------|------|
| Flux 1.1 Pro | $0.04 | Fair | 고품질 |
| Flux Dev | $0.025 | Fair | 저비용 테스트 |
| PhotoMaker | $0.0095 | Excellent | **프로덕션 추천** |

---

## 느낀 점/난이도/발견

### 이번 세션 난이도: ★☆☆☆☆ (1/5)
- 커밋 + 머지만 수행, 코드 변경 없음

### Feature 전체 난이도: ★★★★☆ (4/5)
- Race condition 설계, Replicate API 파라미터 차이, 보안 리뷰가 어려웠음
- 에이전트 활용으로 속도는 빨랐지만 검증(PM 역할)이 핵심

### 발견
- **기존 일지 2개가 이미 상세했음** → 마무리 일지는 요약 + 전체 현황 정리가 적합
- 일지를 세션마다 쓰면 중복이 생기므로, feature 단위 wrap-up이 효율적

---

## 남은 것/미정

### 즉시 필요
- [ ] PhotoMaker 실제 테스트 (얼굴 보존 검증)
- [ ] 에러 케이스 테스트 (402, 400, 429)
- [ ] 모바일 반응형 검증
- [ ] E2E 통합 테스트

### Phase 2 (출시 후)
- [ ] CloudFront + Signed URL (S3 보안 강화)
- [ ] Replicate Webhook (20-40초 블로킹 제거)
- [ ] Sharp 이미지 압축 (비용 절감)
- [ ] NestJS 마이크로서비스 + ComfyUI (월 5,000회 이상 시)

### 다음 기능 개발
- [ ] RSVP 시스템
- [ ] Toss Payments 결제 연동
- [ ] 청첩장 편집기 (dnd-kit)

---

## 다음 액션

1. **PhotoMaker 실제 생성 테스트** - 얼굴 보존 품질 확인이 최우선
2. **에러 시나리오 테스트** - 크레딧 부족, 얼굴 미감지, rate limit 등
3. **다음 feature 브랜치 시작** - RSVP 또는 결제 시스템

---

## 서랍메모

### Feature 브랜치 워크플로우 회고
- Backend → Code Review → Fix → Frontend → Model 확장 → 머지
- 이 순서가 효과적이었음: 백엔드 안정화 후 프론트 붙이기
- Code Review를 중간에 넣은 것이 핵심 (52점 → 85점)

### 비용 추정 (main 반영 기준)
- 무료 사용자: 2회 × $0.038 = $0.076/명
- 프리미엄: 10회 × $0.038 = $0.38/명 (수익 9,900원 대비 ~50원)
- 마진율: 약 99.5% (PhotoMaker 기준)

### 관련 일지
- [Backend + Code Review](./2026-02-04_ai-photo-generation-system.md)
- [Frontend + Model Selection](./2026-02-04_ai-photo-frontend.md)

---

## 질문 평가 및 피드백

### 이번 세션의 질문
1. "모여 나 지금까지 sonnet 4.5쓰고 있었나?"
   - **평가**: 도구 이해 관련, 적절한 질문
   - 모델 전환 시점을 인지한 것이 좋음

2. "지금까지 한거 커밋하자" / "main쪽으로 merge 하자"
   - **평가**: 명확한 지시, 군더더기 없음
   - 커밋 메시지 내용은 AI가 자동 생성 → 확인만 하면 OK

### 전체 Feature 개발 과정 피드백
- **잘한 점**: 계획서 먼저, Code Review 중간 삽입, 보안 이슈 즉시 수정
- **개선할 점**: S3 ACL 보안을 PM이 직접 못 잡음 → 보안 체크리스트 도입 권장
- **교훈**: "계획 1시간 > 수정 3시간" 원칙이 이번에도 증명됨
