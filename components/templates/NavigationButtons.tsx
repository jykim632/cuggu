'use client';

import { getKakaoNaviUrl, getNaverMapUrl, getTMapUrl } from '@/lib/kakao-map';

interface NavigationButtonsProps {
  lat: number;
  lng: number;
  venueName: string;
}

/**
 * 길찾기 버튼 (카카오내비 / 네이버지도 / 티맵)
 *
 * - 모바일: 앱 스킴 시도 → 실패 시 웹 fallback
 * - 데스크톱: 웹 버전 직접 열기
 */
export function NavigationButtons({ lat, lng, venueName }: NavigationButtonsProps) {
  const handleNavigate = (urls: { app: string; web: string }) => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      const start = Date.now();
      window.location.href = urls.app;
      // 앱이 열리면 페이지가 hidden 상태가 됨 → fallback 안 함
      setTimeout(() => {
        if (!document.hidden && Date.now() - start < 1500) {
          window.open(urls.web, '_blank');
        }
      }, 500);
    } else {
      window.open(urls.web, '_blank');
    }
  };

  return (
    <div className="grid grid-cols-3 gap-2 md:gap-3 mt-4">
      <button
        type="button"
        onClick={() => handleNavigate(getKakaoNaviUrl(lat, lng, venueName))}
        className="flex flex-col items-center gap-1.5 p-3 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
      >
        <KakaoIcon />
        <span className="text-xs font-medium text-stone-700">카카오내비</span>
      </button>

      <button
        type="button"
        onClick={() => handleNavigate(getNaverMapUrl(lat, lng, venueName))}
        className="flex flex-col items-center gap-1.5 p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
      >
        <NaverIcon />
        <span className="text-xs font-medium text-stone-700">네이버지도</span>
      </button>

      <button
        type="button"
        onClick={() => handleNavigate(getTMapUrl(lat, lng, venueName))}
        className="flex flex-col items-center gap-1.5 p-3 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 transition-colors"
      >
        <TMapIcon />
        <span className="text-xs font-medium text-stone-700">티맵</span>
      </button>
    </div>
  );
}

// SVG 아이콘 (이모지 대신 심플한 아이콘)
function KakaoIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#FEE500" />
      <path d="M12 6C8.13 6 5 8.46 5 11.5c0 1.97 1.31 3.7 3.28 4.67l-.84 3.08c-.06.22.18.4.37.28l3.68-2.44c.16.01.33.01.51.01 3.87 0 7-2.46 7-5.5S15.87 6 12 6z" fill="#3C1E1E" />
    </svg>
  );
}

function NaverIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#03C75A" />
      <path d="M14.2 12.4L9.6 6H7v12h2.8v-6.4L14.4 18H17V6h-2.8v6.4z" fill="white" />
    </svg>
  );
}

function TMapIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#0064FF" />
      <path d="M7 8h10v2H13.5v8h-3V10H7V8z" fill="white" />
    </svg>
  );
}
