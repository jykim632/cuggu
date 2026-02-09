# AI 이미지 생성 멀티 프로바이더 지원

**날짜**: 2026-02-06
**브랜치**: `feature/multi-provider-ai`
**난이도**: 중상 (아키텍처 리팩토링 + 외부 API 3개 연동)

## 작업한 내용

Replicate 전용이던 AI 이미지 생성 시스템에 **프로바이더 추상화 레이어**를 도입하고, OpenAI와 Google Gemini를 추가했다.

### 추가된 모델
| 모델 | 프로바이더 | 참조이미지 | 특징 |
|------|-----------|-----------|------|
| gpt-image-1 | OpenAI | O | 이미지 편집 API, 얼굴 보존 우수 |
| dall-e-3 | OpenAI | X | 텍스트 전용, 빠름 |
| gemini-2.5-flash-image | Google | O | generateContent로 이미지 생성, 저렴 |

### 아키텍처 변경
- `lib/ai/replicate.ts` (monolithic) → 분리:
  - `lib/ai/providers/types.ts` - GenerationProvider 인터페이스
  - `lib/ai/providers/replicate.ts` - Replicate 구현
  - `lib/ai/providers/openai.ts` - OpenAI 구현 (gpt-image-1 + dall-e-3)
  - `lib/ai/providers/gemini.ts` - Gemini 구현
  - `lib/ai/providers/index.ts` - 프로바이더 라우터
  - `lib/ai/prompts.ts` - 스타일/성별 프롬프트 (공통)
  - `lib/ai/generate.ts` - 프로바이더 무관 오케스트레이터

### DB 변경
- `ai_generations` 테이블에 `provider_job_id`, `provider_type` 컬럼 추가
- `replicate_id`는 하위 호환을 위해 유지 (deprecated)

### API 변경
- `supportsReferenceImage: false`인 모델(dall-e-3)은 얼굴 감지 스킵
- base64 반환 프로바이더(OpenAI, Gemini)는 오케스트레이터에서 S3 업로드 처리
- URL 반환 프로바이더(Replicate)는 기존대로 API route에서 copyToS3

## 왜 했는지

- Replicate만으로는 모델 선택지가 제한적
- OpenAI gpt-image-1의 얼굴 보존 품질이 좋다는 평가
- 가격 경쟁력 확보 (프로바이더별 가격 비교 가능)
- 향후 모델 추가를 쉽게 하기 위한 구조적 투자

## 논의/고민

### Strategy 패턴 vs 함수 기반
- 클래스 계층 구조(Strategy)는 프로바이더 3개에 과도
- 함수 기반 인터페이스 + 모듈별 파일이 더 단순하고 유지보수 쉬움
- **결정**: 함수 기반 `GenerationProvider` 인터페이스

### Imagen 3 삽질
- 처음에 `imagen-3.0-generate-002`로 `generateImages()` 호출 → 404
- `imagen-3.0-capability-001`로 `editImage()` + `SubjectReferenceImage` → "Vertex AI only"
- **결론**: Imagen 3의 `generateImages()`/`editImage()`는 Vertex AI 전용
- Google AI API에서는 `gemini-2.5-flash-image` + `generateContent(responseModalities: ['image'])` 사용

### DB 마이그레이션 전략
- `replicateId` → `providerJobId` rename vs 새 컬럼 추가
- **결정**: 새 컬럼 추가 (rollback 안전, 기존 데이터 보존)

## 결정된 내용

- `AIModel` 인터페이스에 `providerType`, `providerModel`, `supportsReferenceImage` 필드 추가
- 환경변수 `OPENAI_API_KEY`, `GOOGLE_AI_API_KEY`는 optional (해당 모델 비활성화 시 불필요)
- Admin 모델 관리 UI는 자동으로 새 모델 표시 (코드 변경 불필요)

## 발견

- Google AI SDK(`@google/genai`)의 `SubjectReferenceImage`는 plain object가 아니라 클래스 인스턴스로 만들어야 `toReferenceImageAPI()` 메서드가 동작함
- OpenAI `images.edit()`의 `response.data`가 possibly undefined라 null check 필요
- Gemini의 이미지 생성 브랜드명이 "Nano Banana"라는 재미있는 사실

## 남은 것

- [ ] 프로덕션에서 각 모델 품질 비교 테스트
- [ ] 비용 모니터링 (프로바이더별 실제 과금 추적)
- [ ] `replicateId` 컬럼 제거 (안정화 후 2주 뒤)
- [ ] Admin UI에 providerType 뱃지 표시 (선택적)
- [ ] gemini-3-pro-image-preview 모델 추가 검토 (고품질, 2K/4K)

## 다음 액션

1. `.env.local`에 API 키 설정 후 dev 서버에서 전체 플로우 테스트
2. Admin 페이지에서 새 모델 활성/비활성 확인
3. 프로덕션 배포 전 각 모델 품질 비교

## 서랍메모

- Replicate는 URL을 반환하고 OpenAI/Gemini는 base64를 반환하는 차이가 있어서, 오케스트레이터에서 base64→S3 업로드를 처리하는 게 깔끔했음. URL 타입은 기존처럼 API route에서 copyToS3.
- `gemini-2.5-flash-image`가 생각보다 빠르고 품질도 괜찮음. 가격도 저렴해서 기본 모델 후보.

## 내 질문 평가 및 피드백

- DB 마이그레이션 전략(새 컬럼 vs rename) 질문은 적절했음. rollback 안전성 확보.
- OpenAI/Gemini 모델 선택 질문도 좋았음. dall-e-3의 참조이미지 제한을 미리 알려줘서 기대치 관리.
- Imagen 3가 Vertex AI 전용이라는 걸 사전에 파악 못 한 건 아쉬움. docs를 더 꼼꼼히 봤어야 했음.
