# 주소 검색 및 Geocoding 기능 구현 계획 (cuggu-fci)

## 목표

VenueTab에 Kakao Map API 기반 주소 검색 기능 추가:
- 예식장 주소 검색 (Portal 드롭다운)
- 위도/경도 자동 저장
- 청첩장에 지도 표시 (Static Map)
- 길찾기 버튼 (카카오내비/네이버/티맵)

## 핵심 설계 결정

### 1. VenueTab 인라인 구현
- **이유**: 1회성 기능, 재사용 불필요, 컨텍스트 공유 쉬움
- TimePicker 패턴 재사용 (Portal + 절대 위치)

### 2. 클라이언트 직접 API 호출
- **이유**: 빠른 응답, 서버 부하 없음
- 보안: Kakao Developers 도메인 제한 설정

### 3. Static Map 우선
- **이유**: 빠른 로딩, 구현 간단
- Phase 2에서 Interactive Map 추가 고려

## 구현 순서

### Step 1: API 클라이언트 생성 (1시간)

**파일**: `lib/kakao-map.ts` (새로 생성)

```typescript
export interface KakaoAddress {
  address_name: string;
  road_address?: { address_name: string; building_name?: string };
  x: string; // 경도 (lng)
  y: string; // 위도 (lat)
}

export async function searchAddress(query: string): Promise<KakaoAddress[]> {
  const response = await fetch(
    `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(query)}`,
    {
      headers: {
        Authorization: `KakaoAK ${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY}`,
      },
    }
  );

  if (!response.ok) throw new Error(`API 호출 실패: ${response.status}`);

  const data = await response.json();
  return data.documents;
}

export function getStaticMapUrl(lat: number, lng: number): string {
  return `https://dapi.kakao.com/v2/maps/staticmap?center=${lng},${lat}&level=3&marker=${lng},${lat}&size=600x400&appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY}`;
}
```

**검증**: 개발자 도구에서 `searchAddress("강남구 테헤란로")` 호출 → 결과 확인

---

### Step 2: VenueTab 주소 검색 UI (3시간)

**파일**: `components/editor/tabs/VenueTab.tsx` (수정)

**추가할 상태**:
```typescript
const [searchQuery, setSearchQuery] = useState('');
const [searchResults, setSearchResults] = useState<KakaoAddress[]>([]);
const [isSearching, setIsSearching] = useState(false);
const [showDropdown, setShowDropdown] = useState(false);
const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
const inputRef = useRef<HTMLInputElement>(null);
```

**UI 구조**:
```tsx
{/* 주소 검색 */}
<div>
  <label>주소 검색 <span className="text-red-500">*</span></label>
  <div className="relative">
    <input
      ref={inputRef}
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
      placeholder="예: 강남구 테헤란로 152"
    />
    <button onClick={handleSearch} disabled={isSearching}>
      <Search className="w-5 h-5" />
    </button>
  </div>
</div>

{/* Portal 드롭다운 (TimePicker 패턴) */}
{showDropdown && typeof window !== 'undefined' && createPortal(
  <>
    {/* Backdrop */}
    <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />

    {/* Dropdown */}
    <div
      className="fixed z-50 bg-white border rounded-xl shadow-lg"
      style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
    >
      {searchResults.map((result, index) => (
        <button
          key={index}
          onClick={() => handleSelectAddress(result)}
          className="w-full px-4 py-3 hover:bg-pink-50"
        >
          <p className="text-sm font-medium">
            {result.road_address?.address_name || result.address_name}
          </p>
        </button>
      ))}
    </div>
  </>,
  document.body
)}

{/* 선택된 주소 표시 */}
{invitation.wedding?.venue?.address && (
  <div className="mt-3 p-3 bg-pink-50 rounded-lg">
    <MapPin className="w-4 h-4" />
    <p>{invitation.wedding.venue.address}</p>
    {invitation.wedding.venue.lat && (
      <p className="text-xs text-gray-500">
        위도: {invitation.wedding.venue.lat.toFixed(6)},
        경도: {invitation.wedding.venue.lng.toFixed(6)}
      </p>
    )}
  </div>
)}
```

**핸들러 함수**:
```typescript
const handleSearch = async () => {
  if (!searchQuery.trim()) return;

  setIsSearching(true);
  try {
    const results = await searchAddress(searchQuery);
    setSearchResults(results);

    if (results.length > 0 && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX
      });
      setShowDropdown(true);
    }
  } catch (error) {
    console.error('주소 검색 실패:', error);
    alert('주소 검색에 실패했습니다.');
  } finally {
    setIsSearching(false);
  }
};

const handleSelectAddress = (address: KakaoAddress) => {
  const addressName = address.road_address?.address_name || address.address_name;

  updateInvitation({
    wedding: {
      ...invitation.wedding,
      venue: {
        ...invitation.wedding?.venue,
        address: addressName,
        lat: parseFloat(address.y),
        lng: parseFloat(address.x),
      },
    },
  });

  setShowDropdown(false);
  setSearchQuery('');
  setSearchResults([]);
};
```

**검증**:
1. 주소 검색 → 드롭다운 표시
2. 주소 선택 → Zustand store 업데이트 확인
3. 2초 후 자동 저장 확인 (Network 탭)

---

### Step 3: MapSection 컴포넌트 (1시간)

**파일**: `components/templates/MapSection.tsx` (새로 생성)

```typescript
'use client';

import { getStaticMapUrl } from '@/lib/kakao-map';

interface MapSectionProps {
  lat: number;
  lng: number;
  venueName: string;
  address: string;
}

export function MapSection({ lat, lng, venueName, address }: MapSectionProps) {
  const mapUrl = getStaticMapUrl(lat, lng);

  if (!mapUrl) return null;

  return (
    <div className="w-full h-64 rounded-lg overflow-hidden shadow-md">
      <img
        src={mapUrl}
        alt={`${venueName} 위치`}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
```

**검증**: lat/lng 값으로 Static Map 이미지 표시 확인

---

### Step 4: NavigationButtons 컴포넌트 (1시간)

**파일**: `components/templates/NavigationButtons.tsx` (새로 생성)

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

    window.location.href = appUrl;
    setTimeout(() => { window.location.href = webUrl; }, 500);
  };

  const handleNaverMap = () => {
    const appUrl = `nmap://route/car?dlat=${lat}&dlng=${lng}&dname=${encodeURIComponent(venueName)}`;
    const webUrl = `https://map.naver.com/v5/directions/-,-/-,${lat},${lng},${encodeURIComponent(venueName)}`;

    window.location.href = appUrl;
    setTimeout(() => { window.location.href = webUrl; }, 500);
  };

  const handleTMap = () => {
    const appUrl = `tmap://route?goalname=${encodeURIComponent(venueName)}&goaly=${lat}&goalx=${lng}`;
    const webUrl = `https://tmap.life/routes`;

    window.location.href = appUrl;
    setTimeout(() => { window.location.href = webUrl; }, 500);
  };

  return (
    <div className="grid grid-cols-3 gap-3 mt-4">
      <button
        onClick={handleKakaoNavi}
        className="flex flex-col items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100"
      >
        <span className="text-2xl">🗺️</span>
        <span className="text-xs font-medium text-gray-700">카카오내비</span>
      </button>

      <button
        onClick={handleNaverMap}
        className="flex flex-col items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100"
      >
        <span className="text-2xl">🧭</span>
        <span className="text-xs font-medium text-gray-700">네이버지도</span>
      </button>

      <button
        onClick={handleTMap}
        className="flex flex-col items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
      >
        <span className="text-2xl">🚗</span>
        <span className="text-xs font-medium text-gray-700">티맵</span>
      </button>
    </div>
  );
}
```

**검증**: 모바일/데스크톱에서 버튼 클릭 → 앱 또는 웹 열림 확인

---

### Step 5: ClassicTemplate 통합 (1시간)

**파일**: `components/templates/ClassicTemplate.tsx` (수정)

**추가할 섹션** (예식 정보 섹션 다음):
```tsx
import { MapSection } from './MapSection';
import { NavigationButtons } from './NavigationButtons';

{/* 오시는 길 섹션 */}
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

      {/* 길찾기 버튼 */}
      <NavigationButtons
        lat={data.wedding.venue.lat}
        lng={data.wedding.venue.lng}
        venueName={data.wedding.venue.name}
      />

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
```

**검증**: 청첩장 조회 페이지에서 지도 + 길찾기 버튼 확인

---

## Critical Files

| 파일 | 작업 | 예상 시간 |
|------|------|----------|
| `lib/kakao-map.ts` | 새로 생성 | 1시간 |
| `components/editor/tabs/VenueTab.tsx` | 수정 (검색 UI) | 3시간 |
| `components/templates/MapSection.tsx` | 새로 생성 | 1시간 |
| `components/templates/NavigationButtons.tsx` | 새로 생성 | 1시간 |
| `components/templates/ClassicTemplate.tsx` | 수정 (섹션 추가) | 1시간 |

**총 예상**: 7시간

---

## 검증 방법 (End-to-End)

### 1. 편집기 테스트
1. 청첩장 편집 페이지 접속
2. "예식 정보" 탭 → 주소 검색
3. "강남구 테헤란로" 검색 → 결과 확인
4. 주소 선택 → lat/lng 표시 확인
5. 2초 대기 → Network 탭에서 PUT 요청 확인

### 2. 청첩장 조회 테스트
1. 청첩장 조회 페이지 접속
2. "오시는 길" 섹션 확인
3. Static Map 이미지 표시 확인
4. 길찾기 버튼 3개 표시 확인

### 3. 모바일 테스트
1. 모바일 브라우저에서 청첩장 접속
2. 카카오내비 버튼 클릭 → 앱 실행 또는 웹 열림
3. 네이버지도 버튼 클릭 → 앱 실행 또는 웹 열림
4. 티맵 버튼 클릭 → 앱 실행 또는 웹 열림

---

## 리스크 및 대응

### 1. API 키 노출
- **대응**: Kakao Developers에서 허용 도메인 설정 (`localhost:3000`, `cuggu.io`, `*.vercel.app`)

### 2. 주소 검색 정확도
- **대응**: 플레이스홀더 예시 ("예: 강남구 테헤란로 152")
- **Phase 2**: 자동완성 (debounce)

### 3. lat/lng 데이터 무결성
- **대응**: 주소 필드 읽기 전용 (재검색 버튼으로만 수정)

---

## Phase 2 (추후 개선)

- 주소 검색 자동완성 (debounce)
- 편집기 내 지도 미리보기
- Interactive Map (Kakao Map SDK)
- 건물명 검색 (Kakao Local API)
