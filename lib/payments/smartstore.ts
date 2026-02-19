import bcrypt from 'bcryptjs';
import type { PaymentType } from '@/schemas/payment';
import { PAYMENT_AMOUNTS } from '@/schemas/payment';

// ============================================================
// 네이버 Commerce API 클라이언트
// ============================================================

const COMMERCE_API_BASE = 'https://api.commerce.naver.com/external/v1';

// 상품코드 → PaymentType 매핑 (스마트스토어 셀러 상품 코드)
const PRODUCT_CODE_MAP: Record<string, PaymentType> = {
  PREMIUM_UPGRADE: 'PREMIUM_UPGRADE',
  AI_CREDITS: 'AI_CREDITS',
  AI_CREDITS_BUNDLE: 'AI_CREDITS_BUNDLE',
};

// ============================================================
// Access Token (모듈 레벨 캐싱)
// ============================================================

let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Commerce API OAuth 2.0 인증 토큰 발급
 *
 * 서명 생성: bcrypt.hash(clientId_timestamp, clientSecret) → base64
 * clientSecret은 bcrypt salt 형식 ($2a$...)
 */
export async function getAccessToken(): Promise<string> {
  // 캐시 유효하면 재사용
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const clientId = process.env.NAVER_COMMERCE_CLIENT_ID;
  const clientSecret = process.env.NAVER_COMMERCE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('NAVER_COMMERCE_CLIENT_ID and NAVER_COMMERCE_CLIENT_SECRET are required');
  }

  const timestamp = Date.now();
  const password = `${clientId}_${timestamp}`;

  // clientSecret($2a$...)을 bcrypt salt로 사용하여 해싱
  const hashed = bcrypt.hashSync(password, clientSecret);
  const clientSecretSign = Buffer.from(hashed).toString('base64');

  const params = new URLSearchParams({
    client_id: clientId,
    timestamp: String(timestamp),
    client_secret_sign: clientSecretSign,
    grant_type: 'client_credentials',
    type: 'SELF',
  });

  const res = await fetch(`${COMMERCE_API_BASE}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Commerce API 토큰 발급 실패: ${res.status} ${text}`);
  }

  const data = await res.json() as {
    access_token: string;
    expires_in: number;
    token_type: string;
  };

  // expires_in(초) - 60초 여유분
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return data.access_token;
}

// ============================================================
// 주문 조회
// ============================================================

interface ProductOrder {
  productOrderId: string;
  productOrderStatus: string;
  sellerProductCode: string;
  totalPaymentAmount: number;
  quantity: number;
  productName: string;
}

export interface VerifyOrderResult {
  productOrderId: string;
  paymentType: PaymentType;
  amount: number;
  productName: string;
}

/**
 * 상품주문번호로 주문 검증
 *
 * - productOrderStatus === 'PAYED' 확인
 * - sellerProductCode → PaymentType 매핑
 */
export async function verifyOrder(productOrderId: string): Promise<VerifyOrderResult> {
  const token = await getAccessToken();

  const res = await fetch(
    `${COMMERCE_API_BASE}/pay-order/seller/product-orders/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productOrderIds: [productOrderId] }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Commerce API 주문 조회 실패: ${res.status} ${text}`);
  }

  const data = await res.json() as { data: { productOrder: ProductOrder }[] };

  if (!data.data || data.data.length === 0) {
    throw new VerifyError('ORDER_NOT_FOUND', '주문을 찾을 수 없습니다');
  }

  const order = data.data[0].productOrder;

  // 결제 완료 상태만 허용
  if (order.productOrderStatus !== 'PAYED') {
    throw new VerifyError(
      'INVALID_STATUS',
      `주문 상태가 올바르지 않습니다: ${order.productOrderStatus}`
    );
  }

  // 상품코드 → PaymentType 매핑
  const paymentType = mapProductToPaymentType(order.sellerProductCode);
  if (!paymentType) {
    throw new VerifyError(
      'UNKNOWN_PRODUCT',
      `알 수 없는 상품코드: ${order.sellerProductCode}`
    );
  }

  return {
    productOrderId: order.productOrderId,
    paymentType,
    amount: order.totalPaymentAmount,
    productName: order.productName,
  };
}

// ============================================================
// 상품코드 매핑
// ============================================================

export function mapProductToPaymentType(
  sellerProductCode: string
): PaymentType | null {
  return PRODUCT_CODE_MAP[sellerProductCode] ?? null;
}

// ============================================================
// 발송 처리
// ============================================================

/**
 * 디지털 상품 발송 처리 (deliveryMethod: NOTHING)
 *
 * fire-and-forget 용도 — 실패해도 크레딧은 이미 지급됨
 */
export async function dispatchOrder(productOrderId: string): Promise<void> {
  const token = await getAccessToken();

  const res = await fetch(
    `${COMMERCE_API_BASE}/pay-order/seller/product-orders/dispatch`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dispatchProductOrders: [
          {
            productOrderId,
            deliveryMethod: 'NOTHING',
          },
        ],
      }),
    }
  );

  if (!res.ok) {
    // 로깅만, throw 하지 않음 (fire-and-forget)
    const text = await res.text();
    console.error(`Commerce API 발송 처리 실패: ${res.status} ${text}`);
  }
}

// ============================================================
// 에러
// ============================================================

export type VerifyErrorCode =
  | 'ORDER_NOT_FOUND'
  | 'INVALID_STATUS'
  | 'UNKNOWN_PRODUCT';

export class VerifyError extends Error {
  constructor(
    public code: VerifyErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'VerifyError';
  }
}
