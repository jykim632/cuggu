# 2026-02-05 지도 연동 기능 구현

## 작업한 내용

### 완료된 것
- **Kakao Map API 연동 인프라 구축**
  - `/api/search-address` 서버 프록시 API (REST API 키 보호)
  - `lib/kakao-map.ts` 클라이언트 헬퍼 (Zod 스키마 기반 타입)

- **VenueTab 주소 검색 UI**
  - Kakao 키워드 검색 API 연동
  - Portal 드롭다운으로 검색 결과 표시
  - 주소 선택 시 lat/lng 자동 저장
  - 저장된 주소가 있으면 검색 input 숨기고 "수정" 버튼 표시

- **MapSection 컴포넌트**
  - Kakao Map JavaScript SDK로 지도 표시
  - 마커 + 인포윈도우 (예식장 이름)
  - 편집기 + 청첩장 템플릿 양쪽에서 사용

- **NavigationButtons 컴포넌트**
  - 카카오내비, 네이버지도, 티맵 길찾기 버튼
  - 모바일: 앱 → 웹 fallback (document.hidden 체크)
  - 데스크톱: 웹 버전 직접 열기

- **ClassicTemplate "오시는 길" 섹션**
  - 지도 + 주소 정보 + 길찾기 버튼 + 교통편 안내
  - `settings.showMap && lat && lng` 조건부 렌더링

### 진행 중 / 미완료
- `transportation` 필드 저장/조회 이슈 (PUT은 되는데 GET에서 undefined)
- PreviewPanel에서 실시간 반영 확인 필요

## 왜 했는지 (맥락)

청첩장의 핵심 기능 중 하나가 예식장 위치 안내. 기존에는:
- 주소 텍스트 수동 입력만 가능
- lat/lng DB 필드는 있었지만 UI에서 입력 불가
- 지도/길찾기 기능 없음

→ 사용자가 주소 오타 내기 쉽고, 하객이 길찾기하려면 별도로 검색해야 하는 불편함

## 논의/아이디어/고민

### API 키 관리
- `KAKAO_CLIENT_ID` (REST API 키) - 서버 프록시에서 사용
- `NEXT_PUBLIC_KAKAO_MAP_API_KEY` (JavaScript 키) - 클라이언트 SDK에서 사용
- 처음에 두 키를 혼동해서 401 에러 발생

### Static Map vs SDK
- Static Map API: 이미지 URL 방식인데 인증 헤더 필요 → `<img src>`로 불가
- JavaScript SDK: 클라이언트에서 로드, 깔끔하게 지도만 표시 가능 ✅

### 스키마 이슈
- `UpdateInvitationSchema`가 `CreateInvitationSchema` 상속
- `CreateInvitationSchema`의 venue에 lat/lng 없었음 → Zod 파싱 시 필드 삭제됨
- 해결: `VenueSchema` 직접 사용 + `InvitationSchema.partial().omit(...)` 패턴으로 변경

## 결정된 내용

1. **주소 검색**: Kakao 키워드 검색 API 사용 (장소명 검색 가능)
2. **지도 표시**: Kakao Map JavaScript SDK (iframe이 아닌 SDK)
3. **서버 프록시**: REST API 키 보호를 위해 `/api/search-address` 사용
4. **스키마 정리**: `UpdateInvitationSchema = InvitationSchema.partial().omit({...})`

## 느낀 점/난이도/발견

### 난이도
- Kakao API 자체는 문서 잘 돼있어서 쉬움
- **진짜 어려웠던 건 데이터 플로우**:
  - 클라이언트 → Zod 파싱 → DB 저장 → DB 조회 → Zod 변환 → 클라이언트
  - 중간에 하나라도 필드 빠지면 데이터 손실

### 발견
- Zod strict 모드가 기본이라 스키마에 없는 필드는 자동 삭제됨
- `passthrough()` 쓰면 되지만, 정석은 스키마에 필드 다 정의하는 것

## 남은 것/미정

1. **transportation 저장 이슈** - PUT 요청에는 있는데 DB에서 조회 시 없음
2. **디버그 로그 제거** - 완료 후 console.log 정리 필요
3. **다른 템플릿 적용** - ModernTemplate, FloralTemplate 등에도 지도 섹션 추가
4. **env.example 정리** - 키 설명 명확하게

## 다음 액션

1. transportation 저장 문제 디버깅 (서버 로그 확인)
2. 디버그 로그 제거
3. 기능 테스트 후 커밋
4. 다른 템플릿에 지도 섹션 추가 (Phase 2)

## 서랍메모

### Kakao API 키 종류
| 키 | 용도 | 사용 위치 |
|---|---|---|
| REST API 키 | 서버 → Kakao API 호출 | `Authorization: KakaoAK {key}` |
| JavaScript 키 | 클라이언트 SDK 로드 | `sdk.js?appkey={key}` |

### 관련 파일
- `lib/kakao-map.ts` - API 헬퍼
- `app/api/search-address/route.ts` - 서버 프록시
- `components/editor/tabs/VenueTab.tsx` - 주소 검색 UI
- `components/templates/MapSection.tsx` - 지도 표시
- `components/templates/NavigationButtons.tsx` - 길찾기 버튼
- `components/templates/ClassicTemplate.tsx` - 청첩장 템플릿
- `schemas/invitation.ts` - 데이터 스키마

---

## 질문 평가 및 피드백

이번 세션에서 좋았던 질문:
- "주소 검색 에러가 뜬다. 500" → 구체적인 에러 코드 제공
- "payload가 생각보다 엄청 많은데 이거 다 저장해줘야하는거 아냐?" → 문제 핵심 짚음

개선할 수 있는 질문:
- 에러 발생 시 서버 로그/Network 탭 정보 함께 제공하면 디버깅 빨라짐
- "안보여" 같은 짧은 피드백보다 콘솔 로그나 에러 메시지 첨부하면 좋음
