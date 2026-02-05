import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import {
  withErrorHandler,
  successResponse,
  errorResponse,
  validateQuery,
} from '@/lib/api-utils';
import { ERROR_CODES } from '@/schemas';

const KAKAO_REST_API_KEY = process.env.KAKAO_CLIENT_ID;

const SearchQuerySchema = z.object({
  query: z
    .string()
    .min(1, '검색어를 입력해주세요')
    .max(100, '검색어가 너무 깁니다'),
});

const KakaoDocumentSchema = z.object({
  place_name: z.string(),
  address_name: z.string(),
  road_address_name: z.string().default(''),
  phone: z.string().default(''),
  x: z.string(),
  y: z.string(),
});

const KakaoResponseSchema = z.object({
  documents: z.array(KakaoDocumentSchema),
});

/**
 * GET /api/search-address?query=강남구+테헤란로
 *
 * Kakao 키워드 검색 API 서버 프록시
 * - REST API 키를 클라이언트에 노출하지 않음
 * - 장소명/주소 모두 검색 가능 (keyword API)
 */
export const GET = withErrorHandler(async (req: NextRequest) => {
  // 인증 확인
  const session = await auth();
  if (!session?.user) {
    return errorResponse(ERROR_CODES.UNAUTHORIZED, '로그인이 필요합니다', 401);
  }

  // 쿼리 검증
  const { query } = validateQuery(req, SearchQuerySchema);

  if (!KAKAO_REST_API_KEY) {
    return errorResponse(
      ERROR_CODES.SERVICE_UNAVAILABLE,
      '지도 서비스가 설정되지 않았습니다',
      503
    );
  }

  // Kakao 키워드 검색 (장소명 + 주소 모두 검색 가능)
  const kakaoRes = await fetch(
    `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=10`,
    {
      headers: {
        Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
      },
    }
  );

  if (!kakaoRes.ok) {
    console.error('Kakao API error:', kakaoRes.status, await kakaoRes.text());
    return errorResponse(
      ERROR_CODES.INTERNAL_ERROR,
      '주소 검색 중 오류가 발생했습니다',
      502
    );
  }

  // Zod로 외부 API 응답 검증
  const parsed = KakaoResponseSchema.safeParse(await kakaoRes.json());
  if (!parsed.success) {
    console.error('Kakao API response parse error:', parsed.error);
    return errorResponse(
      ERROR_CODES.INTERNAL_ERROR,
      '주소 검색 결과를 처리할 수 없습니다',
      502
    );
  }

  return successResponse(parsed.data.documents);
});
