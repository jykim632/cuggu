# 갤러리 이미지 업로드 + S3 통합 구현

> 날짜: 2026-02-04
> 상태: 구현 완료
> 브랜치: develop (4개 feature 브랜치 머지 완료)
> mode: log

---

## 작업한 내용

에디터 갤러리 탭의 이미지 업로드 기능을 end-to-end로 구현했다. UI 껍데기만 있던 상태에서 실제 S3 업로드, Sharp 최적화, AI 이미지 S3 영구 저장까지 한 세션에 완성.

### 커밋 내역 (4개 feature 브랜치 → develop 머지)

| Branch | Commit | 요약 |
|--------|--------|------|
| `feature/gallery-infra` | `0e3b7d4` | S3 리팩토링, Sharp, 검증유틸, 상수, 환경변수 |
| `feature/ai-s3-copy` | `636d7c2` | AI 이미지 S3 복사, balance 버그, 시그니처 검증 추출 |
| `feature/gallery-upload-api` | `38fb10f` | `POST /api/upload/gallery` 업로드 API |
| `feature/gallery-frontend` | `5ae7217` | GalleryTab 구현, next.config 이미지 도메인 |

### 새 파일 (4개)
- `lib/ai/image-optimizer.ts` — Sharp 기반 WebP 변환/리사이징
- `lib/ai/validation.ts` — 파일 시그니처(Magic Number) 검증
- `app/api/upload/gallery/route.ts` — 갤러리 다중 파일 업로드 API
- `docs/diary/2026-02-04_gallery-upload-planning.md` — 설계 문서

### 수정 파일 (6개)
- `lib/ai/s3.ts` — `getPublicUrl()`, `copyToS3()` 추가, 리턴 `{key, url}`로 변경
- `lib/ai/env.ts` — `CLOUDFRONT_DOMAIN` optional 추가
- `lib/ai/constants.ts` — `GALLERY_CONFIG` 추가, WebP 시그니처
- `app/api/ai/generate/route.ts` — S3 복사 로직, balance 버그, 시그니처 검증 추출
- `components/editor/tabs/GalleryTab.tsx` — 업로드 구현, `image.url` 버그 수정
- `next.config.ts` — S3/CloudFront 이미지 도메인 허용

---

## 왜 했는지

갤러리 탭 UI는 이전 세션에서 만들었지만 `handleImageUpload`가 `console.log`만 찍는 상태였다. 실제 업로드 없이는 에디터가 의미 없으므로 스토리지 인프라부터 프론트까지 한번에 관통 구현.

추가로, AI 생성 이미지가 Replicate CDN URL로만 저장되어 있어서 시간 지나면 만료될 수 있는 문제도 같이 해결 (S3 영구 저장).

---

## 핵심 결정 3가지

### 1. CloudFront 없이 먼저 구현 (fallback 패턴)
- `CLOUDFRONT_DOMAIN` 환경변수가 없으면 S3 직접 URL 사용
- CloudFront 배포 생성은 별도 인프라 작업으로 분리
- `getPublicUrl(key)` 함수 하나로 URL 생성 중앙화 → 나중에 CDN 교체도 쉬움

### 2. Sharp 서버사이드 최적화 (WebP 1200px)
- 10MB 원본 → ~200-400KB WebP (97% 비용 절감)
- 모바일 90%+ 트래픽에서 로딩 속도 직결
- `fit: 'inside', withoutEnlargement: true`로 작은 이미지는 확대 안 함

### 3. DB 스키마 변경 없음
- `galleryImages text[]` (사용자 업로드)와 `aiPhotoUrl varchar` (AI 메인)이 이미 분리됨
- `aiGenerations` 테이블에 AI 이미지 별도 저장
- S3 프리픽스(`gallery/`, `ai-generated/`, `ai-originals/`)로 물리적으로도 분리
- 불필요한 마이그레이션 없이 기존 구조 활용

---

## 논의/고민했던 것

### S3 프리픽스 구조
- `ai-originals/` — AI 입력용 원본 (기존, 유지)
- `ai-generated/{userId}/` — AI 생성 결과물 (Replicate에서 복사)
- `gallery/{userId}/` — 사용자 직접 업로드

userId로 폴더 분리할지 flat하게 갈지 고민했는데, 나중에 사용자별 스토리지 사용량 조회나 정리에 유리하니까 userId 하위로.

### AI 이미지 S3 복사 시 실패 처리
- `Promise.allSettled` 사용 → 4장 중 일부만 복사 실패해도 성공분은 S3 URL, 실패분은 Replicate URL 유지
- graceful degradation — 전체 실패보다 부분 성공이 낫다

### `uploadToS3` 리턴 타입 변경 영향
- `string` → `{ key, url }` 변경이 기존 코드 깨뜨림
- `generate/route.ts`와 테스트 파일 수정 필요했음
- 인프라 브랜치에서 같이 처리해야 빌드가 깨지지 않아서, Step 분리 경계를 조정

---

## 발견한 버그들

1. **`GalleryTab.tsx:79` — `image.url` 접근**: 스키마가 `string[]`인데 `.url` 프로퍼티 접근 → undefined. `image`로 수정
2. **`generate/route.ts:243` — `balance` 스코프 밖**: `checkCreditsFromUser` 결과가 if 블록 안에서만 존재하는데 응답에서 참조 → 실제 DB 조회로 대체
3. **`@types/sharp` deprecated**: Sharp가 자체 타입 제공해서 별도 타입 패키지 불필요. 설치 후 바로 제거

---

## 절대 건드리면 안 되는 부분

- `uploadToS3`의 `{ key, url }` 리턴 구조 — `generate/route.ts`, `upload/gallery/route.ts` 둘 다 이거에 의존
- `GALLERY_CONFIG.OPTIMIZE` 설정 — Sharp 파이프라인과 S3 contentType 결정에 영향
- `isValidImageBuffer`의 바이트 오프셋 — 시그니처 검증 로직 잘못 바꾸면 정상 파일 거부됨

## 바꿔도 되는 부분

- `GALLERY_CONFIG` 숫자값 (한도, 크기, 배치)
- Sharp quality/dimension 설정
- GalleryTab의 UI/스타일링
- S3 프리픽스 이름 (데이터 마이그레이션 필요하긴 하지만)

---

## 남은 것 / TODO

- [ ] **CloudFront 배포 생성** — AWS 콘솔에서 distribution 만들고 `CLOUDFRONT_DOMAIN` env 설정
- [ ] **갤러리 이미지 삭제 시 S3 파일도 삭제** — 현재는 DB에서만 제거, S3 orphan 발생
- [ ] **드래그 앤 드롭 정렬** — dnd-kit으로 이미지 순서 변경 (Phase 3)
- [ ] **프리미엄 tier 동적 반영** — GalleryTab에서 현재 유저 tier 가져와서 한도 표시
- [ ] **AI 생성 사진 → 갤러리 추가** 버튼 — aiGenerations에서 선택한 사진을 갤러리에 넣는 플로우
- [ ] **E2E 테스트** — 실제 S3 업로드 테스트 (dev 환경)

---

## 다음 액션

1. CloudFront 배포 생성 (AWS 콘솔)
2. 실제 이미지로 업로드 E2E 테스트
3. 갤러리 삭제 시 S3 cleanup 구현
4. 프리미엄 tier 동적 반영

---

## 서랍메모

- Sharp는 Vercel에서 Next.js Image Optimization에 쓰이므로 배포 호환성 문제 없음
- `Promise.allSettled` 패턴이 다중 파일 업로드에 딱 맞음 — 부분 실패 허용이 UX에 좋다
- `uploadToS3` 리턴 타입 변경은 파급 범위가 넓었음. 인터페이스 변경 시 호출부 먼저 grep 필수
- `@types/sharp`가 deprecated인 줄 모르고 설치했다가 바로 제거 — 패키지 설치 전 npm 페이지 확인하는 습관
