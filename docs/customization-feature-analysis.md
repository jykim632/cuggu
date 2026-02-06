# 모바일 청첩장 커스터마이징 기능 분석

> 작성일: 2026-02-06
> 목적: 경쟁사 대비 Cuggu 기능 격차 분석 및 확장 로드맵

---

## 1. 현재 Cuggu 기능 현황

### 에디터 구조
- 7탭: 템플릿 > 기본정보 > 예식장 > 인사말 > 갤러리 > 계좌 > 설정
- Figma 스타일 3패널 (사이드바 + 에디터 + 폰 프리뷰)
- 2초 디바운스 자동 저장, Zustand 상태 관리

### 템플릿 (6개, 전부 무료)
| 템플릿 | 색상 | 느낌 |
|--------|------|------|
| Classic | amber/gold | 전통적, 세리프 |
| Modern | emerald/zinc | 모던, 산세리프 |
| Minimal | stone/neutral | 미니멀, 가벼운 |
| Floral | rose/pink | 로맨틱, 장식 |
| Elegant | amber/slate | 고급, 네이비골드 |
| Natural | emerald/stone | 자연, 가든 |

### 섹션 (드래그 앤 드롭 순서 변경 가능)
1. **커버** (고정) - 스플래시, 이름, 날짜
2. **인사말** - 커스텀 텍스트 / 예시 3개
3. **신랑신부 정보** - 부모님, 관계, 고인 표시
4. **예식 정보** - 날짜/시간/장소 카드
5. **오시는 길** - 카카오맵 + 네비게이션 버튼 (카카오/네이버/티맵)
6. **갤러리** - 사진 업로드 (최대 10장) + AI 사진 생성
7. **계좌번호** - 신랑/신부 + 부모님 계좌
8. **참석 여부** - RSVP 폼 (필드별 ON/OFF)
9. **푸터** (고정) - 조회수, 저작권

### 기타 설정
- 섹션별 표시/숨김 (parents, accounts, map, RSVP)
- 비밀번호 보호 (4자리)
- RSVP 필드 토글 (연락처, 동행인원, 식사옵션, 메시지)

---

## 2. 경쟁사 분석

### 주요 경쟁사

**데어무드 (theirmood.com)**
- 시장 리더급, 트렌디한 디자인
- 사진 40장, 썸네일+슬라이드 갤러리, 사진 방향별 자동 크기 조정
- 신랑신부 인터뷰, 방명록, 오프닝 애니메이션
- 중간 사진, 동영상, 배경음악, 엔딩 사진/문구
- 축하 화환, 6 폰트 + 3 크기, 세례명
- 사진 확대 방지, 카카오톡/URL 썸네일 커스텀

**투아워게스트 (toourguest.com)**
- 프리미엄 포지셔닝
- 사진 60장, 12가지 웨딩포스터 스타일
- 혼주용 별도 제작, 축하 화환 선물
- 예식일 하이라이트 3타입 (날짜형/숫자형/시간형)
- 참석의사 수정/삭제, 1년 무제한 수정

### 경쟁사 공통 기능 목록
- 테마/스킨 선택
- 기본 정보 (신랑/신부/부모님)
- 메인 화면 (커버)
- 인사말
- 예식 일시 + **달력 위젯 + D-Day 카운트다운**
- 예식 장소 + 교통편
- **갤러리 (다양한 레이아웃)**
- 엔딩 사진/문구
- 연락처
- 계좌번호
- **배경음악 (BGM)**
- 참석 여부 (RSVP)
- **방명록**
- **인터뷰 (신랑신부 Q&A)**
- 공지사항
- **오프닝 애니메이션**
- **동영상**
- **중간 사진**
- 축하 화환 보내기
- 순서 변경
- **카카오톡/URL 공유 썸네일 커스텀**
- 세례명

---

## 3. 기능 격차 매트릭스

| 기능 | Cuggu | 경쟁사 | 격차 수준 |
|------|-------|--------|----------|
| 갤러리 레이아웃 선택 | 고정 2x3 그리드 | 그리드/슬라이드/매거진 | **심각** |
| D-Day / 달력 위젯 | 없음 (텍스트만) | 달력 + 카운트다운 | **심각** |
| 폰트 선택 | 미사용 (스키마만 존재) | 6+ 폰트, 3단계 크기 | **심각** |
| 엔딩 섹션 | 저작권 푸터만 | 사진 + 마무리 문구 | **심각** |
| 방명록 | 없음 | 공개 축하 메시지 | **심각** |
| 배경음악 (BGM) | 없음 | 웨딩 BGM 재생 | 높음 |
| 동영상 | 없음 | YouTube/Vimeo 임베드 | 보통 |
| 인터뷰 Q&A | 없음 | 신랑신부 질문답변 | 보통 |
| 오프닝 애니메이션 | 단순 페이드인 | 3-5개 프리셋 | 보통 |
| 중간 사진 구분선 | 없음 | 섹션 사이 사진 | 보통 |
| 공유 썸네일 커스텀 | 자동 (첫 갤러리 사진) | 직접 업로드 | 보통 |
| 축하 화환 | 없음 | 가상/실제 화환 | 낮음 |
| 세례명 | 없음 | 선택적 표시 | 낮음 |
| 사진 확대 방지 | 없음 | 토글 설정 | 낮음 |
| **AI 사진 생성** | **있음** | **없음** | **우리 강점** |
| 섹션 순서 변경 | 있음 | 있음 | 동등 |
| 섹션 표시/숨김 | 부분적 | 전체 | 약간 격차 |

---

## 4. 기능별 상세 분석 및 구현 방향

### 4.1 갤러리 레이아웃

**현재**: `grid-cols-2 md:grid-cols-3`, 정사각 크롭 고정, `GalleryLightbox` 공유

**추가할 레이아웃**:
| 레이아웃 | 설명 | 우선순위 |
|----------|------|----------|
| Grid | 현재 방식. 2열 정사각 그리드 | 있음 |
| Slide | 가로 캐러셀, 자동재생, 도트 인디케이터 | Phase 1 |
| Masonry | 핀터레스트 스타일, 사진 비율 유지 | Phase 2 |
| Magazine | 히어로(대) + 썸네일(소) 조합 | Phase 2 |

**구현 방향**:
- `settings.galleryLayout: 'grid' | 'slide' | 'masonry' | 'magazine'`
- `GalleryRenderer` 공통 컴포넌트, layout prop으로 분기
- 캐러셀: `embla-carousel` (경량, React 친화적)
- 매저너리: CSS `columns` (JS 불필요)
- 사진 방향 감지: 업로드 시 width/height 메타데이터 저장

**스키마 변경**:
```typescript
// 현재
gallery.images: z.array(z.string().url())

// 변경 (하위 호환)
gallery.images: z.array(z.union([
  z.string().url(),
  z.object({ url: z.string().url(), width: z.number().optional(), height: z.number().optional() })
]))
```

### 4.2 달력 / D-Day

**현재**: "2024년 5월 18일 토요일 오후 2시 00분" 텍스트만

**추가할 스타일 3가지**:

1. **Calendar** - 해당 월 미니 달력 그리드, 결혼일 하이라이트 (원형 마커)
2. **Countdown** - "D-32" 대형 숫자, 결혼식 후에는 "부부가 된 지 N일"
3. **Minimal** - 타이포그래피 중심, 연/월/일 분리 배치

**구현 방향**:
- `settings.calendarStyle: 'none' | 'calendar' | 'countdown' | 'minimal'`
- `CalendarWidget` 순수 React 컴포넌트 (외부 라이브러리 불필요 - 한 달만 표시)
- 카운트다운: `useEffect` + `setInterval` (1일 단위 갱신)
- ceremony 섹션 내부에 배치 (별도 섹션 아님)

### 4.3 폰트 / 타이포그래피

**현재**: `settings.fontFamily` 스키마에 있지만 **어디서도 사용하지 않음**. 템플릿마다 하드코딩.

**추가할 폰트**:
| 폰트 | 카테고리 | 느낌 |
|-------|----------|------|
| Pretendard | 산세리프 | 모던, 깔끔 (기본값) |
| Noto Serif KR | 세리프 | 클래식 |
| Gowun Batang | 바탕 | 우아 |
| Nanum Myeongjo | 명조 | 전통적 |
| MaruBuri | 세리프 | 현대적 우아 |
| KoPub Batang | 바탕 | 격식있는 |

**크기 프리셋**: 작게(0.9x) / 보통(1.0x) / 크게(1.1x)

**구현 방향**:
- `settings.fontSize: 'sm' | 'md' | 'lg'`
- `next/font`로 선택된 폰트만 로드 (성능 최적화)
- 템플릿 루트에 CSS 변수 `--font-family`, `--text-scale` 적용
- 에디터에 폰트 미리보기 드롭다운

### 4.4 엔딩 섹션

**현재**: 저작권 + 조회수 푸터만

**추가할 것**:
- 전체 너비 사진 + 마무리 문구
- 푸터 바로 위에 고정 배치 (별도 reorderable 섹션 아님)
- 예시 문구: "저희의 새로운 시작을 축복해 주셔서 감사합니다"

**데이터 모델**: `ending: { photo?: string, message?: string }`

### 4.5 방명록 (Guestbook)

**현재**: RSVP만 (참석 여부 중심, 비공개, 주인만 볼 수 있음)

**추가할 것**:
- 공개 축하 메시지 보드 (RSVP와 별개)
- 이름 + 메시지, 인증 불필요
- 주인이 부적절한 메시지 숨김 가능
- 최신순 정렬, 페이지네이션

**새 DB 테이블**:
```sql
guestbook_entries (
  id          varchar PK,
  invitation_id varchar FK -> invitations.id ON DELETE CASCADE,
  name        varchar(100) NOT NULL,
  message     text NOT NULL,
  is_hidden   boolean DEFAULT false,
  created_at  timestamp DEFAULT now()
)
```

**API**: `POST/GET /api/invitations/[id]/guestbook`
**스팸 방지**: Upstash Redis 레이트 리밋 (IP당 분당 3회)

### 4.6 배경음악 (BGM)

**추가할 것**:
- 5-8개 로열티 프리 웨딩 BGM 사전 큐레이션
- 플로팅 재생/일시정지 버튼
- 자동재생 옵션 (모바일은 사용자 제스처 필요)

**구현 방향**:
- S3/CloudFront에 음원 저장
- `settings.bgm: { enabled: boolean, trackId?: string, autoPlay?: boolean }`
- HTML5 `<audio preload="none">` (레이지 로드)
- iOS Safari 자동재생 제한 대응: "음악 재생" 오버레이

### 4.7 동영상

**추가할 것**:
- YouTube/Vimeo URL 입력만으로 임베드
- 프리웨딩 영상, 프러포즈 영상 등

**구현 방향**:
- `video: { url?: string, type: 'youtube' | 'vimeo' }`
- URL 자동 감지 (정규식으로 YouTube/Vimeo 구분)
- 반응형 `<iframe>` + `loading="lazy"`
- 직접 업로드는 Phase 3 이후 (트랜스코딩 필요, 복잡도 높음)

### 4.8 인터뷰 Q&A

**추가할 것**:
- 미리 정의된 질문 템플릿:
  - "첫만남은 어떻게?"
  - "프러포즈는?"
  - "서로의 첫인상은?"
  - "결혼을 결심한 순간은?"
  - "상대방의 매력 포인트는?"
- 신랑/신부 각각 답변, 좌우 또는 상하 카드 레이아웃

**데이터 모델**: `interview: Array<{ question: string, groomAnswer?: string, brideAnswer?: string }>`

### 4.9 오프닝 애니메이션

**현재**: Framer Motion `opacity: 0 → 1` 페이드인만

**추가할 프리셋**:
| 프리셋 | 설명 |
|--------|------|
| fade | 현재 방식 (기본값) |
| curtain | 세로 커튼이 열리며 커버 노출 |
| letter | 편지봉투가 열리는 애니메이션 |
| petal | 꽃잎이 흩날린 후 이름 표시 |
| slide | 이름이 좌우에서 슬라이드인 |

**구현**: 순수 Framer Motion (WebGL 불필요), 2초 이내, LCP 차단하지 않도록 주의

### 4.10 중간 사진 (Section Dividers)

**추가할 것**:
- 섹션과 섹션 사이에 전체 너비 사진 삽입
- 시각적 쉬는 공간, 프리미엄 느낌

**구현 방향**:
- `settings.sectionDividers: Record<string, string>` (sectionId → imageUrl 매핑)
- 템플릿 섹션 루프에서 각 섹션 이후 디바이더 존재 여부 확인
- 에디터 섹션 순서 설정에서 "사진 추가" 버튼

### 4.11 공유 썸네일 커스텀

**현재**: 첫 갤러리 사진 또는 AI 사진으로 자동 OG 태그 생성

**추가할 것**:
- 카카오톡/URL 공유 시 보여줄 이미지 직접 지정
- `share: { ogImage?: string, ogTitle?: string }`
- `generateMetadata()`에서 커스텀 값 우선 적용

---

## 5. 구현 로드맵

### Phase 1: 핵심 격차 해소 (~2주, 8-10일)

없으면 미완성으로 보이는 기능들.

| # | 기능 | 복잡도 | 예상 일수 | 비고 |
|---|------|--------|----------|------|
| 1 | D-Day 달력 위젯 | S | 1-2 | 순수 React, 라이브러리 불필요 |
| 2 | 엔딩 섹션 | S | 1 | 사진 + 문구 |
| 3 | 폰트 선택 | S-M | 1-2 | 6폰트 + 3크기, next/font |
| 4 | 갤러리 슬라이드 뷰 | M | 2 | embla-carousel |
| 5 | 방명록 | M | 2-3 | 새 DB 테이블 + API |
| 6 | 커스텀 OG 공유 이미지 | S | 0.5 | generateMetadata 수정 |

### Phase 2: 참여도 & 완성도 (~3주, 12-16일)

사용자 경험을 한 단계 올리는 기능들.

| # | 기능 | 복잡도 | 예상 일수 |
|---|------|--------|----------|
| 7 | 배경음악 (BGM) | M | 2-3 |
| 8 | 중간 사진 구분선 | S-M | 1-2 |
| 9 | 동영상 임베드 | S | 1 |
| 10 | 인터뷰 Q&A | M | 2-3 |
| 11 | 갤러리 매저너리 | M | 2 |
| 12 | 오프닝 애니메이션 (3종) | M | 2-3 |
| 13 | 카카오 SDK 공유 | M | 1-2 |

### Phase 3: 프리미엄 & 폴리시 (이후)

| # | 기능 | 복잡도 |
|---|------|--------|
| 14 | 축하 화환 (가상) | M |
| 15 | 세례명 표시 | S |
| 16 | 사진 확대 방지 | S |
| 17 | RSVP 수정/삭제 | M |
| 18 | 갤러리 매거진 레이아웃 | M |
| 19 | 직접 동영상 업로드 | L |
| 20 | 혼주용 별도 버전 | L |

---

## 6. 아키텍처 고려사항

### 6.1 에디터 탭 재구성

Settings 탭이 비대해지는 것을 방지하기 위해 **"디자인" 탭 신설** 권장:

```
현재: 템플릿 > 기본정보 > 예식장 > 인사말 > 갤러리 > 계좌 > 설정
변경: 템플릿 > 디자인 > 기본정보 > 예식장 > 인사말 > 갤러리 > 계좌 > 설정
              ^^^^^^
```

**디자인 탭 담당**: 폰트, 크기, 달력 스타일, 갤러리 레이아웃, 오프닝 애니메이션, BGM
**설정 탭 유지**: 섹션 순서, 표시/숨김, RSVP, 비밀번호, 공유

### 6.2 ExtendedData JSONB 확장

새 DB 컬럼 없이 기존 `extendedData` JSONB에 추가. 방명록/화환만 별도 테이블.

```typescript
// settings에 추가되는 필드들
settings: {
  // 기존...
  calendarStyle: 'none' | 'calendar' | 'countdown' | 'minimal',
  galleryLayout: 'grid' | 'slide' | 'masonry' | 'magazine',
  fontSize: 'sm' | 'md' | 'lg',
  showGuestbook: boolean,
  showEnding: boolean,
  bgm: { enabled, trackId, autoPlay },
  openingAnimation: 'fade' | 'curtain' | 'letter' | 'petal' | 'slide',
  showInterview: boolean,
  showVideo: boolean,
  sectionDividers: Record<string, string>,
}

// 새 최상위 필드
ending: { photo?: string, message?: string },
share: { ogImage?: string, ogTitle?: string },
video: { url?: string, type: 'youtube' | 'vimeo' },
interview: Array<{ question, groomAnswer?, brideAnswer? }>,
```

### 6.3 템플릿 리팩토링 (선행 권장)

**문제**: 6개 템플릿이 ~80% 코드 중복. 새 섹션 추가 시 6개 파일 모두 수정 필요.

**해결 방향**: 공유 섹션 컴포넌트 추출
```
components/templates/sections/
  CalendarSection.tsx
  GallerySection.tsx   (layout prop으로 분기)
  GuestbookSection.tsx
  EndingSection.tsx
  InterviewSection.tsx
  VideoSection.tsx
  BGMPlayer.tsx
```

각 템플릿은 테마 객체(색상/폰트/간격)만 정의하고, 섹션 컴포넌트에 theme prop 전달.
→ **Phase 1 전에 리팩토링하면 이후 모든 기능 추가가 1개 파일 수정으로 끝남**

### 6.4 섹션 시스템 확장

```typescript
// 현재
REORDERABLE_SECTIONS = ['greeting', 'parents', 'ceremony', 'map', 'gallery', 'accounts', 'rsvp']

// 확장
REORDERABLE_SECTIONS = ['greeting', 'parents', 'ceremony', 'map', 'gallery', 'interview', 'guestbook', 'video', 'accounts', 'rsvp', 'ending']
```

`sanitizeSectionOrder()`가 이미 누락된 섹션을 자동 추가하므로 하위 호환 유지됨.

### 6.5 성능 주의사항

- **BGM**: `<audio preload="none">` 필수, 초기 번들에 포함하지 않음
- **갤러리 캐러셀**: 20장 이상이면 가상 렌더링 적용 (`embla-carousel` 지원)
- **방명록**: 페이지네이션 (10개씩), SWR 클라이언트 캐싱
- **오프닝 애니메이션**: LCP 차단 금지, 2초 이내, `requestAnimationFrame`
- **폰트**: `next/font`로 선택된 폰트만 로드 (FOIT/FOUT 방지)
- **동영상**: `<iframe loading="lazy">`, 뷰포트 진입 시에만 로드
- **중간 사진**: 800px 너비 최적화 (본문 사진보다 작게)

### 6.6 핵심 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `schemas/invitation.ts` | 새 설정 필드, 엔딩, 공유, 갤러리 스키마 |
| `db/schema.ts` | guestbook_entries 테이블 |
| `lib/editor/tabs.ts` | "디자인" 탭 추가 |
| `lib/invitation-utils.ts` | ExtendedData ↔ 프론트엔드 매핑 |
| `components/editor/EditorPanel.tsx` | DesignTab 라우팅 |
| `components/editor/tabs/` | 새 탭/설정 UI |
| `components/templates/*.tsx` (6개) | 새 섹션 렌더링 |
| `components/templates/sections/` | 공유 섹션 컴포넌트 (신규) |
| `app/inv/[id]/page.tsx` | 커스텀 OG 이미지 |

---

## 7. Cuggu 차별화 전략 요약

| 전략 | 설명 |
|------|------|
| **AI 사진 생성** | 유일한 차별점. 더 강화 필요 |
| **템플릿 다양성** | 극단적 커스터마이징 대신 완성도 높은 템플릿 다수 제공 |
| **기본 커스터마이징 충실** | 폰트/달력/갤러리 레이아웃 등 "기본인데 없으면 아쉬운" 기능 확보 |
| **간편한 제작 경험** | 10분 내 완성 가능한 UX 유지 (복잡도 관리) |

경쟁사가 "모든 걸 커스터마이징 가능"하게 가는 반면, Cuggu는 **"AI로 특별한 사진 + 잘 만든 템플릿 + 적절한 커스터마이징"** 조합으로 차별화.
