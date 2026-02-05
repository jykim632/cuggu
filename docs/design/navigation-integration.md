# 네비게이션 앱 연동 가이드

> 카카오내비, 네이버지도, 티맵 길찾기 연동 작업 목록

## 현재 상태

### 구현 완료
- `NavigationButtons.tsx` - 3개 네비 버튼 UI
- `lib/kakao-map.ts` - URL 생성 헬퍼 함수
- 모바일 앱 스킴 + 웹 fallback 로직

### 미완료
- 실기기 테스트
- URL 스킴 파라미터 검증
- 앱 미설치 시 스토어 리다이렉트

---

## 1. 카카오내비

### 현재 구현
```typescript
// App Scheme
kakaonavi://navigate?name=${name}&lat=${lat}&lng=${lng}

// Web Fallback
https://map.kakao.com/link/to/${name},${lat},${lng}
```

### TODO
- [ ] **Kakao Developers 설정**
  - [카카오 개발자 콘솔](https://developers.kakao.com) 접속
  - 앱 선택 → 카카오내비 API 사용 설정 ON
  - 플랫폼 등록 (iOS Bundle ID, Android 패키지명 - 웹앱이므로 선택사항)

- [ ] **App Scheme 파라미터 검증**
  - `ep` (출발지) 파라미터 추가 고려: `&sp=${현재위치lat},${현재위치lng}`
  - `rpOption` (경로 옵션): `1`=추천, `2`=최단, `3`=무료도로
  - 참고: https://developers.kakao.com/docs/latest/ko/kakaonavi/common

- [ ] **웹 Fallback 테스트**
  - 데스크톱에서 `https://map.kakao.com/link/to/...` 정상 동작 확인

---

## 2. 네이버지도

### 현재 구현
```typescript
// App Scheme
nmap://route/car?dlat=${lat}&dlng=${lng}&dname=${name}

// Web Fallback
https://map.naver.com/v5/directions/-,-/-,${lat},${lng},${name}
```

### TODO
- [ ] **네이버 클라우드 플랫폼 설정** (선택)
  - [네이버 클라우드](https://www.ncloud.com) → Maps API 등록
  - URL Scheme은 API 키 없이 동작하지만, 호출량 추적 원하면 등록

- [ ] **App Scheme 파라미터 추가**
  ```typescript
  // 더 정확한 파라미터
  nmap://route/car?dlat=${lat}&dlng=${lng}&dname=${name}&appname=com.cuggu.app
  ```
  - `appname`: 호출 앱 식별자 (선택)
  - `slat/slng`: 출발지 좌표 (생략 시 현재 위치)

- [ ] **웹 Fallback URL 수정 필요**
  ```typescript
  // 현재 (동작 불안정)
  https://map.naver.com/v5/directions/-,-/-,${lat},${lng},${name}

  // 권장 (더 안정적)
  https://map.naver.com/p/directions/-/-/-/car?destination=${lat},${lng}&destinationName=${name}
  ```

- [ ] **참고 문서**
  - https://guide.ncloud-docs.com/docs/maps-url-scheme

---

## 3. 티맵

### 현재 구현
```typescript
// App Scheme
tmap://route?goalname=${name}&goaly=${lat}&goalx=${lng}

// Web Fallback (단순 랜딩)
https://tmap.life/routes
```

### TODO
- [ ] **App Scheme 파라미터 검증**
  ```typescript
  // 정확한 파라미터
  tmap://route?goalname=${name}&goaly=${lat}&goalx=${lng}&rGoX=${lng}&rGoY=${lat}
  ```
  - `rGoX`, `rGoY`: WGS84 좌표 (경도, 위도)
  - `rGoName`: 도착지 이름

- [ ] **웹 Fallback 개선**
  - 현재: 티맵 홈으로만 이동 (좌표 전달 불가)
  - 대안 1: 앱 미설치 시 스토어 링크로 리다이렉트
  - 대안 2: 티맵 웹 버전 API 확인 (공식 지원 없음)
  ```typescript
  // 개선안 - 앱스토어로 유도
  web: 'https://tmap.life/routes' // 웹에서는 안내만
  // 또는
  web: 'market://details?id=com.skt.tmap.ku' // Android 앱스토어
  ```

- [ ] **SK Open API 등록** (선택)
  - https://openapi.sk.com
  - 호출량 추적 필요시

---

## 4. 공통 작업

### 모바일 실기기 테스트
- [ ] **iOS Safari 테스트**
  - 카카오내비 앱 설치 O → 앱 열림
  - 카카오내비 앱 설치 X → 웹 fallback
  - 네이버지도, 티맵 동일 테스트

- [ ] **Android Chrome 테스트**
  - 동일 시나리오

- [ ] **카카오톡 인앱 브라우저 테스트**
  - 대부분 하객이 카톡으로 청첩장 열기 때문에 필수
  - 인앱 브라우저에서 앱 스킴 동작 확인

### Fallback 로직 개선
```typescript
// 현재 로직
const handleNavigate = (urls: { app: string; web: string }) => {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile) {
    const start = Date.now();
    window.location.href = urls.app;
    setTimeout(() => {
      if (!document.hidden && Date.now() - start < 1500) {
        window.open(urls.web, '_blank');
      }
    }, 500);
  } else {
    window.open(urls.web, '_blank');
  }
};
```

- [ ] **개선 1: visibility API 정확도**
  - `document.hidden` 체크가 모든 브라우저에서 동작하는지 확인
  - `visibilitychange` 이벤트 리스너 방식 검토

- [ ] **개선 2: Intent URL (Android)**
  ```typescript
  // Android에서 더 안정적인 방식
  const androidIntent = `intent://route?...#Intent;scheme=kakaonavi;package=com.locnall.KimGiSa;end`;
  ```

- [ ] **개선 3: Universal Links (iOS)**
  - 앱이 설치되어 있으면 앱으로, 없으면 웹으로 자동 분기
  - 각 서비스의 Universal Link 지원 여부 확인

### 앱 미설치 시 스토어 리다이렉트
```typescript
// 스토어 URL
const storeUrls = {
  kakao: {
    ios: 'https://apps.apple.com/kr/app/id417698849',
    android: 'market://details?id=com.locnall.KimGiSa',
  },
  naver: {
    ios: 'https://apps.apple.com/kr/app/id311867728',
    android: 'market://details?id=com.nhn.android.nmap',
  },
  tmap: {
    ios: 'https://apps.apple.com/kr/app/id431589174',
    android: 'market://details?id=com.skt.tmap.ku',
  },
};
```

- [ ] 앱 실행 실패 시 "앱 설치" 안내 모달 표시 고려

---

## 5. 우선순위

| 순위 | 작업 | 이유 |
|------|------|------|
| P0 | 카카오톡 인앱 브라우저 테스트 | 90%+ 트래픽 |
| P0 | 네이버지도 웹 fallback URL 수정 | 현재 동작 불안정 |
| P1 | iOS/Android 실기기 테스트 | 출시 전 필수 |
| P1 | 티맵 웹 fallback 개선 | UX 개선 |
| P2 | Intent URL 적용 (Android) | 안정성 향상 |
| P2 | 앱스토어 리다이렉트 | 설치 유도 |

---

## 6. 테스트 체크리스트

```markdown
### 카카오내비
- [ ] iOS (앱 O) → 앱 열림, 목적지 설정됨
- [ ] iOS (앱 X) → 카카오맵 웹 열림
- [ ] Android (앱 O) → 앱 열림
- [ ] Android (앱 X) → 카카오맵 웹 열림
- [ ] 카카오톡 인앱 (앱 O) → ?
- [ ] 카카오톡 인앱 (앱 X) → ?

### 네이버지도
- [ ] iOS (앱 O) → 앱 열림, 목적지 설정됨
- [ ] iOS (앱 X) → 네이버지도 웹 열림
- [ ] Android (앱 O) → 앱 열림
- [ ] Android (앱 X) → 네이버지도 웹 열림
- [ ] 카카오톡 인앱 (앱 O) → ?
- [ ] 카카오톡 인앱 (앱 X) → ?

### 티맵
- [ ] iOS (앱 O) → 앱 열림, 목적지 설정됨
- [ ] iOS (앱 X) → 티맵 웹 (제한적)
- [ ] Android (앱 O) → 앱 열림
- [ ] Android (앱 X) → 티맵 웹 (제한적)
- [ ] 카카오톡 인앱 (앱 O) → ?
- [ ] 카카오톡 인앱 (앱 X) → ?
```

---

## 참고 자료

- [카카오내비 API 문서](https://developers.kakao.com/docs/latest/ko/kakaonavi/common)
- [네이버지도 URL Scheme](https://guide.ncloud-docs.com/docs/maps-url-scheme)
- [티맵 연동 가이드](https://openapi.sk.com) (SK Open API)
