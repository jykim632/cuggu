'use client';

import { useEffect, useRef, useState } from 'react';

interface MapSectionProps {
  lat: number;
  lng: number;
  venueName: string;
}

declare global {
  interface Window {
    kakao: any;
  }
}

/**
 * Kakao Map SDK 컴포넌트
 *
 * - JavaScript SDK로 깔끔한 지도만 표시
 * - 마커 + 인포윈도우
 */
export function MapSection({ lat, lng, venueName }: MapSectionProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY;
    if (!apiKey) {
      setHasError(true);
      return;
    }

    // 이미 SDK 완전히 로드됨 (load() 콜백까지 완료)
    if (typeof window.kakao?.maps?.LatLng === 'function') {
      setIsLoaded(true);
      return;
    }

    // SDK 객체는 있지만 load() 아직 안 됨
    if (window.kakao?.maps) {
      window.kakao.maps.load(() => {
        setIsLoaded(true);
      });
      return;
    }

    // 이미 스크립트 태그가 있는지 확인
    const existingScript = document.querySelector('script[src*="dapi.kakao.com/v2/maps/sdk.js"]');
    if (existingScript) {
      // 스크립트는 있지만 아직 로드 안 됨 → kakao.maps.load() 완료 대기
      const checkLoaded = setInterval(() => {
        if (window.kakao?.maps) {
          clearInterval(checkLoaded);
          // autoload=false이므로 load() 콜백 완료 확인 필요
          if (typeof window.kakao.maps.LatLng === 'function') {
            setIsLoaded(true);
          } else {
            window.kakao.maps.load(() => setIsLoaded(true));
          }
        }
      }, 100);
      return () => clearInterval(checkLoaded);
    }

    // SDK 스크립트 로드
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false`;
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => {
        setIsLoaded(true);
      });
    };
    script.onerror = () => setHasError(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      initMap();
    }
  }, [lat, lng, venueName, isLoaded]);

  const initMap = () => {
    if (!mapRef.current || !window.kakao?.maps) return;

    const position = new window.kakao.maps.LatLng(lat, lng);

    const map = new window.kakao.maps.Map(mapRef.current, {
      center: position,
      level: 3,
    });

    // 마커
    const marker = new window.kakao.maps.Marker({
      position,
      map,
    });

    // 인포윈도우
    const infowindow = new window.kakao.maps.InfoWindow({
      content: `<div style="padding:5px 10px;font-size:12px;white-space:nowrap;text-align:center;">${venueName}</div>`,
    });
    infowindow.open(map, marker);
  };

  if (hasError) {
    return (
      <div className="w-full h-48 md:h-64 rounded-lg bg-stone-100 flex items-center justify-center">
        <p className="text-sm text-stone-400">지도를 불러올 수 없습니다</p>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className="w-full h-48 md:h-64 rounded-lg overflow-hidden shadow-sm bg-stone-100"
    />
  );
}
