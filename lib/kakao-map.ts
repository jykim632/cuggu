/**
 * Kakao Map API 클라이언트
 *
 * - 주소/키워드 검색은 서버 프록시 (/api/search-address) 경유
 * - Static Map URL은 클라이언트에서 직접 생성
 *   (Kakao Developers 콘솔에서 도메인 제한 필수 설정)
 */

import { z } from 'zod';

// ============================================================
// Types (Zod 스키마 기반)
// ============================================================

export const KakaoPlaceSchema = z.object({
  place_name: z.string(),
  address_name: z.string(),
  road_address_name: z.string(),
  phone: z.string(),
  x: z.string(), // 경도 (lng)
  y: z.string(), // 위도 (lat)
});

export type KakaoPlace = z.infer<typeof KakaoPlaceSchema>;

// ============================================================
// 주소/장소 검색 (서버 프록시 경유)
// ============================================================

export async function searchPlace(query: string): Promise<KakaoPlace[]> {
  const res = await fetch(
    `/api/search-address?query=${encodeURIComponent(query)}`
  );

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message || '주소 검색에 실패했습니다');
  }

  const json = await res.json();
  return json.data;
}

// ============================================================
// Static Map URL
// Kakao Developers 콘솔에서 NEXT_PUBLIC_KAKAO_REST_API_KEY에
// 해당하는 앱의 웹 플랫폼 도메인을 반드시 등록해야 합니다.
// (localhost:3000, cuggu.io, *.vercel.app)
// ============================================================

export function getStaticMapUrl(
  lat: number,
  lng: number,
  width = 600,
  height = 300
): string {
  const key = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY;
  if (!key) return '';

  // Kakao Static Map API - REST API 키 사용
  // marker 파라미터: "위도,경도" 형식
  return `https://dapi.kakao.com/v2/maps/staticmap?appkey=${key}&center=${lng},${lat}&level=3&size=${width}x${height}&markers=${lng},${lat}`;
}

// ============================================================
// Navigation URL helpers
// ============================================================

export function getKakaoNaviUrl(lat: number, lng: number, name: string) {
  return {
    app: `kakaonavi://navigate?name=${encodeURIComponent(name)}&lat=${lat}&lng=${lng}`,
    web: `https://map.kakao.com/link/to/${encodeURIComponent(name)},${lat},${lng}`,
  };
}

export function getNaverMapUrl(lat: number, lng: number, name: string) {
  return {
    app: `nmap://route/car?dlat=${lat}&dlng=${lng}&dname=${encodeURIComponent(name)}`,
    web: `https://map.naver.com/v5/directions/-,-/-,${lat},${lng},${encodeURIComponent(name)}`,
  };
}

export function getTMapUrl(lat: number, lng: number, name: string) {
  return {
    app: `tmap://route?goalname=${encodeURIComponent(name)}&goaly=${lat}&goalx=${lng}`,
    web: `https://tmap.life/routes`,
  };
}
