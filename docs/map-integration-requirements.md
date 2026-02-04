# 청첩장 지도 및 주소 검색 기능 요구사항 문서

## 1. 현황 분석

### 1.1 현재 구현 상태

#### DB 스키마 (db/schema.ts)
```typescript
// Venue 스키마에 lat/lng 필드 존재
export const VenueSchema = z.object({
  name: z.string().min(1, "예식장 이름을 입력해주세요"),
  hall: z.string().optional(),
  address: z.string().min(1, "주소를 입력해주세요"),
  lat: z.number().optional(),  // ✅ 위도 필드 있음
  lng: z.number().optional(),  // ✅ 경도 필드 있음
  tel: z.string().optional(),
  transportation: z.string().optional(),
});
```

#### UI (components/editor/tabs/VenueTab.tsx:145-156)
```typescript
<input
  type="text"
  value={invitation.wedding?.venue?.address || ''}
  onChange={(e) => handleVenueChange('address', e.target.value)}
  placeholder="서울시 강남구 테헤란로 123"
/>
```

- ❌ **주소 수동 입력만 가능** (타이핑 오류 가능)
- ❌ **lat/lng 입력 UI 없음** (DB 필드 있지만 사용 불가)
- ❌ **주소 검색 기능 없음**
- ❌ **지도 미리보기 없음**

#### 템플릿 (components/templates/ClassicTemplate.tsx:179-201)
```typescript
{/* 장소 */}
<div className="flex items-start gap-3 md:gap-4">
  <MapPin className="w-5 h-5 md:w-6 md:h-6 text-amber-600" />
  <div>
    <p className="text-sm md:text-base text-gray-800 font-medium mb-1">
      {data.wedding.venue.name}
      {data.wedding.venue.hall && ` ${data.wedding.venue.hall}`}
    </p>
    <p className="text-xs md:text-sm text-gray-600 mb-2 md:mb-3">
      {data.wedding.venue.address}
    </p>
  </div>
</div>
```

- ❌ **지도 표시 없음** (텍스트만)
- ❌ **길찾기 버튼 없음**
- ❌ **lat/lng 데이터 활용 안 함**

---

## 2. 지도 API 비교 및 선택

### 2.1 옵션 비교

| 항목 | Kakao Map API | Naver Map API | Google Maps API |
|------|---------------|---------------|-----------------|
| **무료 한도** | 월 30만건 | 월 10만건 | 월 $200 크레딧 |
| **주소 검색** | ✅ 무료 | ✅ 무료 | ✅ 무료 (한도 내) |
| **Geocoding** | ✅ 무료 | ✅ 무료 | ✅ 무료 (한도 내) |
| **Web SDK** | ✅ 무료 | ✅ 무료 | ❌ 유료 (한도 초과 시) |
| **Static Map** | ✅ 무료 | ✅ 무료 | ❌ 유료 |
| **국내 정확도** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **사용자 익숙도** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **카카오톡 연동** | ✅ 자연스러움 | ❌ | ❌ |
| **문서 품질** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

### 2.2 선택: **Kakao Map API** (권장)

**선택 이유:**
1. **무료 한도 넉넉함** (월 30만건, MVP에 충분)
2. **카카오톡 공유와 자연스러운 연동** (청첩장 주요 공유 채널)
3. **한국 사용자 익숙도 최고** (국내 1위 내비게이션)
4. **국내 주소 정확도 우수**
5. **문서 깔끔하고 예제 풍부**

**비용 예측 (월):**
- 청첩장 생성 500건/월 가정
- 주소 검색: 500건 (청첩장당 1회)
- 지도 표시: 10,000건 (청첩장당 평균 20회 조회)
- **총: 10,500건/월 → 무료 한도(30만건) 내**

**URL:**
- 공식 문서: https://apis.map.kakao.com/
- API 키 발급: https://developers.kakao.com/

---

## 3. 구현 방안

### 3.1 주소 검색 (Geocoding) - VenueTab

#### 3.1.1 UI 레이아웃

```
┌─ 예식장 정보 ───────────────────────────────────────┐
│ 예식장 이름: [서울웨딩홀                          ] │
│                                                      │
│ 홀 이름: [3층 그랜드홀                            ] │
│                                                      │
│ 주소 검색: [강남구 테헤란로...        ] [🔍 검색] │
│ ↓ (검색 결과 드롭다운)                             │
│ ┌──────────────────────────────────────────────┐   │
│ │ • 서울 강남구 테헤란로 152 (역삼동, 강남파이낸스센터) │
│ │ • 서울 강남구 테헤란로 123 (역삼동)          │   │
│ │ • 서울 강남구 테헤란로 427 (삼성동)          │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ 선택된 주소: 서울 강남구 테헤란로 152              │
│ (위도: 37.5048, 경도: 127.0393)                    │
│                                                      │
│ [📍 지도에서 확인하기]                             │
└──────────────────────────────────────────────────────┘
```

#### 3.1.2 Kakao 주소 검색 API

**API 엔드포인트:**
```
GET https://dapi.kakao.com/v2/local/search/address.json?query={주소}
```

**요청 헤더:**
```typescript
Authorization: KakaoAK {REST_API_KEY}
```

**응답 예시:**
```json
{
  "documents": [
    {
      "address_name": "서울 강남구 테헤란로 152",
      "address": {
        "region_1depth_name": "서울",
        "region_2depth_name": "강남구",
        "region_3depth_name": "역삼동"
      },
      "road_address": {
        "address_name": "서울 강남구 테헤란로 152",
        "building_name": "강남파이낸스센터"
      },
      "x": "127.039338123456",  // 경도 (lng)
      "y": "37.504820567890"    // 위도 (lat)
    }
  ]
}
```

#### 3.1.3 구현 코드

##### A. API 클라이언트 (`lib/kakao-map.ts`)

```typescript
// lib/kakao-map.ts
const KAKAO_REST_API_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY!;

export interface KakaoAddress {
  address_name: string;
  road_address?: {
    address_name: string;
    building_name?: string;
  };
  x: string; // 경도 (lng)
  y: string; // 위도 (lat)
}

export async function searchAddress(query: string): Promise<KakaoAddress[]> {
  const response = await fetch(
    `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(query)}`,
    {
      headers: {
        Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('주소 검색 실패');
  }

  const data = await response.json();
  return data.documents;
}
```

##### B. VenueTab 개선 (`components/editor/tabs/VenueTab.tsx`)

```typescript
'use client';

import { useState } from 'react';
import { useInvitationEditor } from '@/stores/invitation-editor';
import { searchAddress, KakaoAddress } from '@/lib/kakao-map';
import { Search, MapPin } from 'lucide-react';

export function VenueTab() {
  const { invitation, updateInvitation } = useInvitationEditor();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<KakaoAddress[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 주소 검색
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await searchAddress(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('주소 검색 실패:', error);
      alert('주소 검색에 실패했습니다.');
    } finally {
      setIsSearching(false);
    }
  };

  // 주소 선택
  const handleSelectAddress = (address: KakaoAddress) => {
    const addressName = address.road_address?.address_name || address.address_name;

    updateInvitation({
      wedding: {
        ...invitation.wedding,
        venue: {
          ...invitation.wedding?.venue,
          address: addressName,
          lat: parseFloat(address.y), // 위도
          lng: parseFloat(address.x), // 경도
        },
      },
    });

    setSearchResults([]); // 드롭다운 닫기
    setSearchQuery('');
  };

  return (
    <div className="space-y-6">
      {/* ... 기존 코드 ... */}

      {/* 주소 검색 */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          주소 검색 <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="예식장 주소를 검색하세요 (예: 강남구 테헤란로 152)"
            className="w-full px-4 py-3 pr-12 text-sm bg-white border border-pink-200/50 rounded-xl"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-pink-600 hover:text-pink-700"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* 검색 결과 드롭다운 */}
          {searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-white border border-pink-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectAddress(result)}
                  className="w-full px-4 py-3 text-left hover:bg-pink-50 border-b border-pink-100 last:border-0"
                >
                  <p className="text-sm font-medium text-gray-800">
                    {result.road_address?.address_name || result.address_name}
                  </p>
                  {result.road_address?.building_name && (
                    <p className="text-xs text-gray-500 mt-1">
                      {result.road_address.building_name}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 선택된 주소 표시 */}
        {invitation.wedding?.venue?.address && (
          <div className="mt-3 p-3 bg-pink-50 rounded-lg">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-pink-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-800">
                  {invitation.wedding.venue.address}
                </p>
                {invitation.wedding.venue.lat && invitation.wedding.venue.lng && (
                  <p className="text-xs text-gray-500 mt-1">
                    위도: {invitation.wedding.venue.lat.toFixed(6)}, 경도: {invitation.wedding.venue.lng.toFixed(6)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

### 3.2 지도 표시 - 템플릿

#### 3.2.1 Option 1: Kakao Static Map (권장 - 빠르고 간단)

**장점:**
- API 호출 없음 (이미지 URL만 생성)
- 서버 부하 없음
- 빠른 로딩

**단점:**
- 인터랙션 불가 (확대/축소/드래그 안 됨)

**구현:**
```typescript
// components/templates/MapSection.tsx
interface MapSectionProps {
  lat: number;
  lng: number;
  venueName: string;
  address: string;
}

export function MapSection({ lat, lng, venueName, address }: MapSectionProps) {
  const KAKAO_API_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY!;
  const mapUrl = `https://dapi.kakao.com/v2/maps/staticmap?center=${lng},${lat}&level=3&marker=${lng},${lat}&size=600x400&appkey=${KAKAO_API_KEY}`;

  return (
    <div className="w-full h-64 rounded-lg overflow-hidden">
      <img
        src={mapUrl}
        alt={`${venueName} 위치`}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
```

#### 3.2.2 Option 2: Kakao Map SDK (인터랙티브)

**장점:**
- 확대/축소/드래그 가능
- 사용자 경험 향상

**단점:**
- 클라이언트 사이드 렌더링 필요
- 스크립트 로딩 시간

**구현:**
```typescript
// components/templates/KakaoMap.tsx
'use client';

import { useEffect, useRef } from 'react';

interface KakaoMapProps {
  lat: number;
  lng: number;
  venueName: string;
}

declare global {
  interface Window {
    kakao: any;
  }
}

export function KakaoMap({ lat, lng, venueName }: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Kakao Map SDK 로드
    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY}&autoload=false`;
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      window.kakao.maps.load(() => {
        if (!mapRef.current) return;

        const options = {
          center: new window.kakao.maps.LatLng(lat, lng),
          level: 3, // 확대 레벨
        };

        const map = new window.kakao.maps.Map(mapRef.current, options);

        // 마커 표시
        const markerPosition = new window.kakao.maps.LatLng(lat, lng);
        const marker = new window.kakao.maps.Marker({
          position: markerPosition,
        });
        marker.setMap(map);

        // 인포윈도우 (말풍선)
        const infowindow = new window.kakao.maps.InfoWindow({
          content: `<div style="padding:5px 10px;">${venueName}</div>`,
        });
        infowindow.open(map, marker);
      });
    };

    return () => {
      document.head.removeChild(script);
    };
  }, [lat, lng, venueName]);

  return <div ref={mapRef} className="w-full h-64 rounded-lg" />;
}
```

#### 3.2.3 템플릿 적용 (`ClassicTemplate.tsx`)

```typescript
// components/templates/ClassicTemplate.tsx
import { MapSection } from './MapSection'; // Static Map
// 또는
import { KakaoMap } from './KakaoMap'; // Interactive Map

export function ClassicTemplate({ data }: ClassicTemplateProps) {
  return (
    <div>
      {/* ... 기존 섹션들 ... */}

      {/* 지도 섹션 */}
      {data.wedding.venue.lat && data.wedding.venue.lng && (
        <section className="py-12 md:py-20 px-6">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl md:text-2xl font-serif text-center text-gray-800 mb-8">
              오시는 길
            </h2>

            {/* 지도 */}
            <MapSection
              lat={data.wedding.venue.lat}
              lng={data.wedding.venue.lng}
              venueName={data.wedding.venue.name}
              address={data.wedding.venue.address}
            />

            {/* 주소 정보 */}
            <div className="mt-4 p-4 bg-amber-50 rounded-lg">
              <p className="text-sm font-medium text-gray-800">
                {data.wedding.venue.name}
                {data.wedding.venue.hall && ` ${data.wedding.venue.hall}`}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {data.wedding.venue.address}
              </p>
            </div>

            {/* 교통편 안내 */}
            {data.wedding.venue.transportation && (
              <div className="mt-4 p-4 bg-white rounded-lg border border-amber-100">
                <p className="text-xs font-semibold text-gray-700 mb-2">교통편</p>
                <p className="text-xs text-gray-600 whitespace-pre-line">
                  {data.wedding.venue.transportation}
                </p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
```

### 3.3 길찾기 버튼 (URL 스킴)

#### 3.3.1 URL 스킴 정리

| 앱 | URL 스킴 | 웹 fallback |
|-----|----------|-------------|
| **Kakao Navi** | `kakaonavi://navigate?name={name}&lat={lat}&lng={lng}` | `https://map.kakao.com/link/to/{name},{lat},{lng}` |
| **Naver Map** | `nmap://route/car?dlat={lat}&dlng={lng}&dname={name}` | `https://map.naver.com/v5/directions/-,-/-,{lat},{lng},{name}` |
| **T Map** | `tmap://route?goalname={name}&goaly={lat}&goalx={lng}` | `https://tmap.life/routes` |

#### 3.3.2 구현 (`components/templates/NavigationButtons.tsx`)

```typescript
'use client';

interface NavigationButtonsProps {
  lat: number;
  lng: number;
  venueName: string;
}

export function NavigationButtons({ lat, lng, venueName }: NavigationButtonsProps) {
  const handleKakaoNavi = () => {
    const appUrl = `kakaonavi://navigate?name=${encodeURIComponent(venueName)}&lat=${lat}&lng=${lng}`;
    const webUrl = `https://map.kakao.com/link/to/${encodeURIComponent(venueName)},${lat},${lng}`;

    // 모바일에서 앱 시도, 실패 시 웹으로
    window.location.href = appUrl;
    setTimeout(() => {
      window.location.href = webUrl;
    }, 500);
  };

  const handleNaverMap = () => {
    const appUrl = `nmap://route/car?dlat=${lat}&dlng=${lng}&dname=${encodeURIComponent(venueName)}`;
    const webUrl = `https://map.naver.com/v5/directions/-,-/-,${lat},${lng},${encodeURIComponent(venueName)}`;

    window.location.href = appUrl;
    setTimeout(() => {
      window.location.href = webUrl;
    }, 500);
  };

  const handleTMap = () => {
    const appUrl = `tmap://route?goalname=${encodeURIComponent(venueName)}&goaly=${lat}&goalx=${lng}`;
    const webUrl = `https://tmap.life/routes`;

    window.location.href = appUrl;
    setTimeout(() => {
      window.location.href = webUrl;
    }, 500);
  };

  return (
    <div className="grid grid-cols-3 gap-3 mt-4">
      <button
        onClick={handleKakaoNavi}
        className="flex flex-col items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
      >
        <span className="text-2xl">🗺️</span>
        <span className="text-xs font-medium text-gray-700">카카오내비</span>
      </button>

      <button
        onClick={handleNaverMap}
        className="flex flex-col items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
      >
        <span className="text-2xl">🧭</span>
        <span className="text-xs font-medium text-gray-700">네이버지도</span>
      </button>

      <button
        onClick={handleTMap}
        className="flex flex-col items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
      >
        <span className="text-2xl">🚗</span>
        <span className="text-xs font-medium text-gray-700">티맵</span>
      </button>
    </div>
  );
}
```

#### 3.3.3 템플릿 적용

```typescript
// ClassicTemplate.tsx
import { NavigationButtons } from './NavigationButtons';

{/* 지도 섹션 내부 */}
<NavigationButtons
  lat={data.wedding.venue.lat}
  lng={data.wedding.venue.lng}
  venueName={data.wedding.venue.name}
/>
```

---

## 4. 기술 스택

### 4.1 API & SDK

| 항목 | 기술 | 용도 |
|------|------|------|
| **주소 검색** | Kakao REST API | Geocoding (주소 → 위도/경도) |
| **지도 표시** | Kakao Static Map | 이미지 기반 지도 (권장) |
| **지도 인터랙션** | Kakao Map SDK | JavaScript 기반 지도 (선택) |
| **길찾기** | URL 스킴 | Kakao/Naver/Tmap 앱 연동 |

### 4.2 환경 변수

```bash
# .env.local
NEXT_PUBLIC_KAKAO_MAP_API_KEY=your_kakao_api_key_here
```

**API 키 발급 절차:**
1. Kakao Developers 로그인: https://developers.kakao.com/
2. 애플리케이션 생성
3. 플랫폼 설정 → Web 플랫폼 추가 → 도메인 등록
4. "JavaScript 키" 발급 (클라이언트용)
5. "REST API 키" 발급 (서버용)

---

## 5. 비용 예측

### 5.1 Kakao Map API 무료 한도

| API | 무료 한도 | 초과 시 비용 |
|-----|----------|-------------|
| **주소 검색** | 월 30만건 | 건당 10원 |
| **Static Map** | 무제한 | 무료 |
| **Map SDK** | 무제한 | 무료 |

### 5.2 예상 사용량 (월 500개 청첩장 생성)

| 항목 | 예상 사용량 | 비용 |
|------|------------|------|
| 주소 검색 (편집기) | 500건 | 무료 |
| 지도 표시 (조회) | 10,000건 (청첩장당 20회 조회) | 무료 |
| **총계** | 10,500건 | **0원** |

**결론:** MVP 단계에서는 **완전 무료**

### 5.3 스케일업 시나리오 (월 10,000개 청첩장)

| 항목 | 예상 사용량 | 비용 |
|------|------------|------|
| 주소 검색 | 10,000건 | 무료 |
| 지도 표시 | 200,000건 | 무료 |
| **총계** | 210,000건 | **0원** (30만건 한도 내) |

**결론:** 상당한 규모까지 **무료**

---

## 6. 구현 우선순위

### Phase 1: 핵심 기능 (필수)
- [ ] **1.1** Kakao API 키 발급 및 환경 변수 설정
- [ ] **1.2** 주소 검색 API 클라이언트 구현 (`lib/kakao-map.ts`)
- [ ] **1.3** VenueTab 주소 검색 UI 추가
- [ ] **1.4** 주소 선택 시 lat/lng 자동 저장
- [ ] **1.5** 템플릿에 Static Map 표시
- [ ] **1.6** 길찾기 버튼 (Kakao/Naver/Tmap)

### Phase 2: UX 개선 (추가 가치)
- [ ] **2.1** 주소 검색 debounce (타이핑 후 500ms 대기)
- [ ] **2.2** 검색 결과 하이라이팅
- [ ] **2.3** "현재 위치에서 찾기" 버튼 (Geolocation API)
- [ ] **2.4** 지도 미리보기 (편집기 내)
- [ ] **2.5** 주소 수정 가능 (재검색)

### Phase 3: 고급 기능 (선택)
- [ ] **3.1** Interactive Map (Kakao Map SDK)
- [ ] **3.2** 주차장 정보 표시
- [ ] **3.3** 대중교통 정보 API 연동
- [ ] **3.4** 지도 스타일 커스터마이징 (템플릿별)

---

## 7. 리스크 및 고려사항

### 7.1 API 키 보안

**문제:** 클라이언트에서 API 키 노출

**해결 방안:**
1. **JavaScript 키 사용** (도메인 제한 가능)
   - Kakao Developers에서 허용 도메인 등록
   - `localhost`, `cuggu.io`, `*.vercel.app` 등록

2. **REST API 키는 서버 사이드만 사용**
   - `/api/search-address` 엔드포인트 생성
   - 클라이언트는 자체 API 호출

**권장:** JavaScript 키 + 도메인 제한 (간단하고 안전)

### 7.2 주소 검색 정확도

**문제:** 사용자가 잘못된 주소 입력

**해결:**
1. **자동완성** (Autocomplete) 제공
2. **지도 미리보기**로 확인
3. **수동 수정 가능**하게 유지

### 7.3 모바일 앱 미설치

**문제:** 길찾기 버튼 클릭 시 앱 없음

**해결:**
- URL 스킴 실패 시 자동으로 웹 버전으로 fallback
- 구현된 코드에서 `setTimeout()` 사용

### 7.4 지도 로딩 성능

**Static Map vs Interactive Map:**

| 항목 | Static Map | Interactive Map |
|------|------------|-----------------|
| **로딩 속도** | ⚡ 빠름 (이미지) | 🐌 느림 (SDK 로드) |
| **인터랙션** | ❌ 없음 | ✅ 확대/드래그 |
| **트래픽** | 🟢 낮음 | 🟡 높음 |
| **추천** | ✅ MVP | 나중에 업그레이드 |

**권장:** **Phase 1에서는 Static Map만 사용**

### 7.5 주소 변경 시 lat/lng 업데이트

**문제:** 사용자가 주소를 수동으로 수정하면 lat/lng가 안 맞음

**해결:**
1. **주소 필드 읽기 전용**으로 변경
2. **재검색 버튼** 제공
3. lat/lng 없으면 지도 표시 안 함

---

## 8. 테스트 시나리오

### 8.1 주소 검색 테스트

| 입력 | 기대 결과 |
|------|----------|
| "강남구 테헤란로" | 여러 주소 결과 표시 |
| "ㅁㄴㅇㄹ" (오타) | "검색 결과 없음" 메시지 |
| "" (빈 입력) | 검색 버튼 비활성화 |
| "서울웨딩홀" (건물명) | 해당 건물 주소 검색 |

### 8.2 지도 표시 테스트

| 조건 | 기대 결과 |
|------|----------|
| lat/lng 있음 | 지도 + 마커 표시 |
| lat/lng 없음 | 지도 섹션 숨김 |
| 잘못된 좌표 | 에러 처리 (기본 위치 표시) |

### 8.3 길찾기 버튼 테스트

| 환경 | 동작 |
|------|------|
| 모바일 + 앱 설치됨 | 앱 실행 |
| 모바일 + 앱 없음 | 웹 버전 열림 |
| 데스크톱 | 웹 버전 열림 |

---

## 9. 다음 단계

1. **Kakao API 키 발급**
   - Kakao Developers 계정 생성
   - 애플리케이션 등록
   - JavaScript 키 + REST API 키 발급

2. **Phase 1 구현**
   - `lib/kakao-map.ts` 작성
   - VenueTab 개선
   - MapSection 컴포넌트 생성
   - NavigationButtons 컴포넌트 생성
   - ClassicTemplate에 통합

3. **테스트**
   - 다양한 주소 검색 테스트
   - 지도 표시 확인
   - 모바일에서 길찾기 버튼 테스트

4. **베타 테스트**
   - 실제 사용자 피드백
   - 주소 검색 정확도 검증

---

## 10. 참고 자료

### Kakao Map API 문서
- **공식 문서**: https://apis.map.kakao.com/
- **주소 검색 API**: https://developers.kakao.com/docs/latest/ko/local/dev-guide
- **Static Map**: https://developers.kakao.com/docs/latest/ko/local/dev-guide#static-map
- **Map SDK**: https://apis.map.kakao.com/web/
- **URL 스킴**: https://developers.kakaomobility.com/docs/navi-api/web-url/

### 네이버/티맵 URL 스킴
- **Naver Map**: https://guide.ncloud-docs.com/docs/navermaps-url-scheme
- **T Map**: https://tmapapi.sktelecom.com/main.html

### 예제 프로젝트
- **Next.js + Kakao Map**: https://github.com/kakao-maps/kakao-maps-sdk-v3
