/**
 * 카카오 OG 유틸리티
 *
 * 카카오톡 공유 미리보기는 OG 태그를 캐싱함.
 * 프로그래밍 방식의 캐시 초기화 공식 API가 없으므로,
 * OG 이미지 URL에 버전 파라미터를 추가하여 캐시를 우회.
 */

/**
 * 청첩장 URL 생성
 */
export function getInvitationUrl(invitationId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cuggu.com';
  return `${baseUrl}/inv/${invitationId}`;
}

/**
 * OG 이미지 URL에 버전 파라미터 추가 (카카오 캐시 우회)
 *
 * 카카오톡은 OG 이미지 URL을 키로 캐싱하므로,
 * updatedAt 타임스탬프를 쿼리 파라미터로 붙이면
 * 이미지 변경 시 새 URL로 인식 → 재스크래핑 유도.
 */
export function appendOgVersion(imageUrl: string, updatedAt: Date | string | null): string {
  if (!imageUrl || !updatedAt) return imageUrl;
  const ts = updatedAt instanceof Date ? updatedAt.getTime() : new Date(updatedAt).getTime();
  if (isNaN(ts)) return imageUrl;
  const separator = imageUrl.includes('?') ? '&' : '?';
  return `${imageUrl}${separator}v=${ts}`;
}
