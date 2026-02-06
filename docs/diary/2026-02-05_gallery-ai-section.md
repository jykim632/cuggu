# 2026-02-05 에디터 갤러리 AI 웨딩 사진 섹션 구현

## 작업한 내용

에디터 갤러리 탭에 AI 웨딩 사진 생성 기능을 통합했다.

### 핵심 변경
1. **갤러리 탭 섹션 분리**: '일반 사진' / 'AI 웨딩 사진' 두 섹션으로 구조화
2. **스트리밍 AI 생성**: 4장을 병렬 생성 → 순차 생성 + 실시간 표시로 변경
3. **이미지 모달**: 모든 이미지 클릭 시 확대 보기

### 추가된 파일 (12개, +1399줄)
```
app/api/ai/generate/stream/route.ts     # SSE 스트리밍 API
components/editor/tabs/gallery/
├── AIPhotoGenerator.tsx                # 신랑/신부 개별 생성 UI
├── AIPhotoSection.tsx                  # AI 섹션 래퍼
├── AIResultGallery.tsx                 # 결과 다중 선택 갤러리
├── AIStreamingGallery.tsx              # 생성 중 실시간 표시
├── GalleryImageGrid.tsx                # 일반 이미지 그리드
└── ImageModal.tsx                      # 확대 모달
docs/design/gallery-ai-section.md       # 설계 문서
```

---

## 왜 했는지 (맥락)

기존에 `/dashboard/ai-photos` 페이지에서만 AI 사진 생성이 가능했는데, 에디터 갤러리 탭에서 바로 생성할 수 있도록 통합하려고 함. 사용자 흐름이 끊기지 않게.

---

## 논의/아이디어/고민

### 1. AI 섹션 진입점
- **선택지**:
  - A) 갤러리 탭 내에서 직접 생성
  - B) ai-photos 페이지로 연결
  - C) 갤러리 탭에 AI 섹션 분리 ✅
- **결정**: C - 한 화면에 두 섹션 자연스럽게 공존

### 2. 4장 선택 방식
- **선택지**:
  - A) 전체 4장 자동 추가
  - B) 선택한 것만 추가 (1~4장) ✅
  - C) 대표 1장만 선택
- **결정**: B - 다중 선택으로 유연하게

### 3. Replicate Rate Limit 문제
- **문제**: Replicate 크레딧이 $5 미만이면 병렬 요청 불가 (burst 1개)
- **해결**: 병렬 → 순차 생성으로 변경 + 스트리밍 UI로 UX 보완
- **보너스**: 체감 대기 시간 단축 (이미지 1장씩 나타남)

### 4. 개발 모드 크레딧
- **문제**: 개발 중 테스트할 때마다 크레딧 차감
- **해결**: `NODE_ENV === 'development'`일 때 999 크레딧 반환

---

## 결정된 내용

| 항목 | 결정 |
|------|------|
| 섹션 구조 | 일반 사진 / AI 웨딩 사진 분리 |
| AI 섹션 기본 상태 | 펼쳐진 상태 (접이식 제거) |
| 선택 방식 | 다중 선택 (1~4장) |
| 생성 방식 | 순차 생성 + SSE 스트리밍 |
| 원본 표시 | 생성 중 원본 증명사진 표시 |
| 모달 | 모든 이미지 클릭 시 확대 |

---

## 느낀 점/난이도/발견

### 난이도: ★★★☆☆
- SSE 스트리밍 구현이 생각보다 간단했음
- 기존 ai-photos 컴포넌트 재사용으로 시간 절약

### 발견
- Replicate rate limit이 크레딧 잔액에 따라 달라짐 ($5 미만이면 burst 1)
- Next.js에서 SSE는 TransformStream으로 구현

### 아쉬운 점
- 총 생성 시간은 순차라서 더 길어짐 (병렬 대비)
- Webhook 비동기 처리하면 더 좋겠지만 복잡도 상승

---

## 남은 것/미정

1. **실제 AI 생성 테스트** - Replicate 크레딧 확인 후 E2E 테스트
2. **에러 핸들링 개선** - 네트워크 끊김 시 재시도 로직
3. **프리뷰 연동** - 생성된 AI 사진이 프리뷰에 반영되는지 확인

---

## 다음 액션

- [ ] AI 생성 E2E 테스트 (Replicate 연동)
- [ ] 프리뷰 패널에서 갤러리 이미지 표시 확인
- [ ] main 브랜치로 머지

---

## 서랍메모

```
SSE 스트리밍 패턴:
const stream = new TransformStream();
const writer = stream.writable.getWriter();
await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
return new Response(stream.readable, { headers: { 'Content-Type': 'text/event-stream' } });
```

---

## 내 질문 평가 및 피드백

오늘 세션은 비교적 명확한 요구사항으로 진행됨. 중간에 Replicate rate limit 이슈가 나왔을 때 스트리밍 방식으로 전환하는 결정이 좋았음. 질문이 구체적이라 빠르게 진행할 수 있었음.
