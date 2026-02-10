'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useInvitationEditor } from '@/stores/invitation-editor';
import { DatePicker } from '@/components/ui/DatePicker';
import { TimePicker } from '@/components/ui/TimePicker';
import { searchPlace, KakaoPlace, getStaticMapUrl } from '@/lib/kakao-map';
import { Search, MapPin, Loader2, X } from 'lucide-react';
import { MapSection } from '@/components/templates/MapSection';

/**
 * 예식 정보 탭
 *
 * - 예식 날짜/시간 (필수)
 * - 예식장 정보 (필수)
 * - 주소 검색 (Kakao keyword API, 서버 프록시 경유)
 * - 홀 이름
 * - 교통편
 */
export function VenueTab() {
  const { invitation, updateInvitation } = useInvitationEditor();

  // 주소 검색 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<KakaoPlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [noResults, setNoResults] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // wedding.date ISO string을 날짜/시간으로 파싱
  const parseDateAndTime = (isoString?: string) => {
    if (!isoString) return { date: undefined, time: undefined };
    const dt = new Date(isoString);
    return {
      date: dt,
      time: `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`,
    };
  };

  const { date: weddingDate, time: weddingTime } = parseDateAndTime(invitation.wedding?.date);

  // 날짜만 변경
  const handleDateChange = (date: Date | undefined) => {
    if (!date) return;

    // 기존 시간 유지 (없으면 시간 설정 안 함)
    if (weddingTime) {
      const [hours, minutes] = weddingTime.split(':');
      date.setHours(Number(hours), Number(minutes));
    }

    updateInvitation({
      wedding: {
        ...invitation.wedding,
        date: date.toISOString(),
        venue: invitation.wedding?.venue,
      },
    });
  };

  // 시간만 변경
  const handleTimeChange = (time: string) => {
    // 날짜가 없으면 오늘 날짜로 설정
    const baseDate = weddingDate || new Date();
    const [hours, minutes] = time.split(':');
    baseDate.setHours(Number(hours), Number(minutes), 0, 0);

    updateInvitation({
      wedding: {
        ...invitation.wedding,
        date: baseDate.toISOString(),
        venue: invitation.wedding?.venue,
      },
    });
  };

  const handleVenueChange = (field: string, value: string | number | undefined) => {
    updateInvitation({
      wedding: {
        ...invitation.wedding,
        venue: {
          ...invitation.wedding?.venue,
          [field]: value,
        },
      },
    });
  };

  // ============================================================
  // 주소 검색
  // ============================================================

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;

    setIsSearching(true);
    setNoResults(false);
    try {
      const results = await searchPlace(q);
      setSearchResults(results);
      setNoResults(results.length === 0);

      if (inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
      setShowDropdown(true);
    } catch {
      setSearchResults([]);
      setNoResults(true);
      setShowDropdown(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPlace = (place: KakaoPlace) => {
    const addressName = place.road_address_name || place.address_name;

    updateInvitation({
      wedding: {
        ...invitation.wedding,
        venue: {
          ...invitation.wedding?.venue,
          address: addressName,
          lat: parseFloat(place.y),
          lng: parseFloat(place.x),
          tel: place.phone || invitation.wedding?.venue?.tel,
        },
      },
    });

    setShowDropdown(false);
    setSearchQuery('');
    setSearchResults([]);
    setNoResults(false);
    setIsEditingAddress(false);
  };

  const handleClearAddress = () => {
    updateInvitation({
      wedding: {
        ...invitation.wedding,
        venue: {
          ...invitation.wedding?.venue,
          address: '',
          lat: undefined,
          lng: undefined,
        },
      },
    });
  };

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    if (!showDropdown) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowDropdown(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDropdown]);

  const hasAddress = !!invitation.wedding?.venue?.address;
  const hasCoords = !!invitation.wedding?.venue?.lat && !!invitation.wedding?.venue?.lng;

  // ============================================================
  // Render
  // ============================================================

  const dropdown = showDropdown ? (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={() => setShowDropdown(false)}
      />

      {/* Results */}
      <div
        className="fixed z-50 bg-white rounded-xl shadow-xl border border-stone-200 max-h-72 overflow-y-auto"
        style={{
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          width: `${dropdownPosition.width}px`,
        }}
      >
        {searchResults.length > 0 ? (
          searchResults.map((place, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelectPlace(place)}
              className="w-full px-4 py-3 text-left hover:bg-stone-50 border-b border-stone-100 last:border-0 transition-colors"
            >
              <p className="text-sm font-medium text-stone-800">
                {place.place_name}
              </p>
              <p className="text-xs text-stone-500 mt-0.5">
                {place.road_address_name || place.address_name}
              </p>
              {place.phone && (
                <p className="text-xs text-stone-400 mt-0.5">{place.phone}</p>
              )}
            </button>
          ))
        ) : noResults ? (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-stone-500">검색 결과가 없습니다</p>
            <p className="text-xs text-stone-400 mt-1">
              다른 검색어로 다시 시도해주세요
            </p>
          </div>
        ) : null}
      </div>
    </>
  ) : null;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-xl font-semibold text-stone-900 tracking-tight mb-1">예식 정보</h2>
        <p className="text-sm text-stone-500">결혼식 날짜와 장소를 입력하세요</p>
      </div>

      {/* 날짜/시간 */}
      <div className="bg-white rounded-xl p-6 space-y-4 border border-stone-200">
        <h3 className="text-sm font-medium text-stone-700 mb-3">예식 일시</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-2">
              날짜 <span className="text-red-500">*</span>
            </label>
            <DatePicker
              selected={weddingDate}
              onSelect={handleDateChange}
              placeholder="날짜를 선택하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-600 mb-2">
              시간 <span className="text-red-500">*</span>
            </label>
            <TimePicker
              value={weddingTime}
              onChange={handleTimeChange}
              placeholder="시간을 선택하세요"
            />
          </div>
        </div>
      </div>

      {/* 예식장 정보 */}
      <div className="bg-white rounded-xl p-6 space-y-4 border border-stone-200">
        <h3 className="text-sm font-medium text-stone-700 mb-3">예식장</h3>

        <div>
          <label className="block text-sm font-medium text-stone-600 mb-2">
            예식장 이름 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={invitation.wedding?.venue?.name || ''}
            onChange={(e) => handleVenueChange('name', e.target.value)}
            placeholder="서울웨딩홀"
            className="w-full px-4 py-3 text-sm bg-white border border-stone-200 rounded-lg focus:ring-1 focus:ring-pink-300 focus:border-pink-300 transition-colors placeholder:text-stone-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-600 mb-2">
            홀 이름
          </label>
          <input
            type="text"
            value={invitation.wedding?.venue?.hall || ''}
            onChange={(e) => handleVenueChange('hall', e.target.value)}
            placeholder="3층 그랜드홀"
            className="w-full px-4 py-3 text-sm bg-white border border-stone-200 rounded-lg focus:ring-1 focus:ring-pink-300 focus:border-pink-300 transition-colors placeholder:text-stone-400"
          />
        </div>

        {/* 주소 검색 */}
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-2">
            주소 <span className="text-red-500">*</span>
          </label>

          {/* 주소가 없거나 편집 모드일 때 검색 input 표시 */}
          {(!hasAddress || isEditingAddress) && (
            <div className="mb-3">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                  placeholder="예식장 이름 또는 주소를 검색하세요"
                  className="w-full px-4 py-3 pr-12 text-sm bg-white border border-stone-200 rounded-lg focus:ring-1 focus:ring-pink-300 focus:border-pink-300 transition-colors placeholder:text-stone-400"
                />
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-stone-400 hover:text-pink-500 disabled:opacity-40 transition-colors"
                >
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* 편집 중일 때 취소 버튼 */}
              {isEditingAddress && hasAddress && (
                <button
                  type="button"
                  onClick={() => setIsEditingAddress(false)}
                  className="mt-2 text-xs text-stone-500 hover:text-stone-600 transition-colors"
                >
                  취소
                </button>
              )}
            </div>
          )}

          {/* 저장된 주소가 있을 때 항상 표시 */}
          {hasAddress && (
            <div className="p-3 bg-stone-50 rounded-lg">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-stone-800">
                    {invitation.wedding!.venue!.address}
                  </p>
                </div>
                {!isEditingAddress && (
                  <button
                    type="button"
                    onClick={() => setIsEditingAddress(true)}
                    className="px-3 py-1.5 text-xs text-pink-600 bg-pink-50 hover:bg-pink-100 font-medium rounded-md transition-colors"
                  >
                    수정
                  </button>
                )}
              </div>

              {/* 지도 미리보기 */}
              {hasCoords && (
                <div className="mt-3">
                  <MapSection
                    lat={invitation.wedding!.venue!.lat!}
                    lng={invitation.wedding!.venue!.lng!}
                    venueName={invitation.wedding!.venue!.name || '예식장'}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-600 mb-2">
            교통편 안내
          </label>
          <textarea
            value={invitation.wedding?.venue?.transportation || ''}
            onChange={(e) => handleVenueChange('transportation', e.target.value)}
            placeholder="지하철: 강남역 3번 출구 도보 5분&#10;버스: 146, 301, 402 강남역 하차"
            rows={4}
            className="w-full px-4 py-3 text-sm bg-white border border-stone-200 rounded-lg focus:ring-1 focus:ring-pink-300 focus:border-pink-300 transition-colors resize-none placeholder:text-stone-400"
          />
        </div>
      </div>

      {/* Portal Dropdown */}
      {typeof window !== 'undefined' && createPortal(dropdown, document.body)}
    </div>
  );
}
