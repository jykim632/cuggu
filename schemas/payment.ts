import { z } from 'zod';

// ============================================================
// Payment Schemas
// ============================================================

// Enums
export const PaymentTypeSchema = z.enum([
  'PREMIUM_UPGRADE',
  'AI_CREDITS',
  'AI_CREDITS_BUNDLE',
]);

export const PaymentStatusSchema = z.enum([
  'PENDING',
  'COMPLETED',
  'FAILED',
  'REFUNDED',
]);

export const PaymentMethodSchema = z.enum(['TOSS', 'KAKAO_PAY', 'CARD']);

export type PaymentType = z.infer<typeof PaymentTypeSchema>;
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

// Base Payment Schema (DB 모델과 매칭)
export const PaymentSchema = z.object({
  id: z.string().cuid2(),
  userId: z.string().cuid2(),

  type: PaymentTypeSchema,
  method: PaymentMethodSchema,
  amount: z.number().int().min(0), // KRW
  creditsGranted: z.number().int().min(0).nullable(),
  status: PaymentStatusSchema.default('PENDING'),
  orderId: z.string().max(255).nullable(),
  paymentKey: z.string().max(255).nullable(),

  createdAt: z.date(),
});

export type Payment = z.infer<typeof PaymentSchema>;

// ============================================================
// API Request/Response Schemas
// ============================================================

// 결제 요청 생성
export const CreatePaymentRequestSchema = z.object({
  type: PaymentTypeSchema,
  method: PaymentMethodSchema.default('TOSS'),
});

export type CreatePaymentRequest = z.infer<typeof CreatePaymentRequestSchema>;

// 결제 승인 요청 (Toss Payments)
export const ApprovePaymentRequestSchema = z.object({
  orderId: z.string().min(1, '주문 ID가 필요합니다'),
  paymentKey: z.string().min(1, '결제 키가 필요합니다'),
  amount: z.number().int().min(0, '결제 금액이 필요합니다'),
});

export type ApprovePaymentRequest = z.infer<typeof ApprovePaymentRequestSchema>;

// 결제 응답
export const PaymentResponseSchema = PaymentSchema.omit({
  userId: true,
  paymentKey: true,
});

export type PaymentResponse = z.infer<typeof PaymentResponseSchema>;

// 결제 목록 응답
export const PaymentListResponseSchema = z.object({
  payments: z.array(PaymentResponseSchema),
  total: z.number().int().min(0),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(100),
});

export type PaymentListResponse = z.infer<typeof PaymentListResponseSchema>;

// ============================================================
// Toss Payments Schemas
// ============================================================

// Toss Payments 승인 응답
export const TossPaymentApprovalResponseSchema = z.object({
  mId: z.string(),
  lastTransactionKey: z.string(),
  paymentKey: z.string(),
  orderId: z.string(),
  orderName: z.string(),
  taxExemptionAmount: z.number().optional(),
  status: z.string(),
  requestedAt: z.string(),
  approvedAt: z.string(),
  useEscrow: z.boolean(),
  cultureExpense: z.boolean().optional(),
  card: z
    .object({
      issuerCode: z.string(),
      acquirerCode: z.string().optional(),
      number: z.string(),
      installmentPlanMonths: z.number(),
      isInterestFree: z.boolean(),
      interestPayer: z.string().optional(),
      approveNo: z.string(),
      useCardPoint: z.boolean(),
      cardType: z.string(),
      ownerType: z.string(),
      acquireStatus: z.string(),
      receiptUrl: z.string(),
      amount: z.number(),
    })
    .optional(),
  virtualAccount: z
    .object({
      accountType: z.string(),
      accountNumber: z.string(),
      bankCode: z.string(),
      customerName: z.string(),
      dueDate: z.string(),
      refundStatus: z.string(),
      expired: z.boolean(),
      settlementStatus: z.string(),
      refundReceiveAccount: z
        .object({
          bankCode: z.string(),
          accountNumber: z.string(),
          holderName: z.string(),
        })
        .optional(),
    })
    .optional(),
  transfer: z
    .object({
      bankCode: z.string(),
      settlementStatus: z.string(),
    })
    .optional(),
  mobilePhone: z
    .object({
      customerMobilePhone: z.string(),
      settlementStatus: z.string(),
      receiptUrl: z.string(),
    })
    .optional(),
  giftCertificate: z
    .object({
      approveNo: z.string(),
      settlementStatus: z.string(),
    })
    .optional(),
  cashReceipt: z
    .object({
      type: z.string(),
      receiptKey: z.string(),
      issueNumber: z.string(),
      receiptUrl: z.string(),
      amount: z.number(),
      taxFreeAmount: z.number(),
    })
    .optional(),
  cashReceipts: z
    .array(
      z.object({
        receiptKey: z.string(),
        orderId: z.string(),
        orderName: z.string(),
        type: z.string(),
        issueNumber: z.string(),
        receiptUrl: z.string(),
        businessNumber: z.string(),
        transactionType: z.string(),
        amount: z.number(),
        taxFreeAmount: z.number(),
        issueStatus: z.string(),
        failure: z
          .object({
            code: z.string(),
            message: z.string(),
          })
          .optional(),
        customerIdentityNumber: z.string(),
        requestedAt: z.string(),
      })
    )
    .optional(),
  discount: z
    .object({
      amount: z.number(),
    })
    .optional(),
  cancels: z
    .array(
      z.object({
        cancelAmount: z.number(),
        cancelReason: z.string(),
        taxExemptionAmount: z.number().optional(),
        taxFreeAmount: z.number(),
        refundableAmount: z.number(),
        easyPayDiscountAmount: z.number(),
        canceledAt: z.string(),
        transactionKey: z.string(),
        receiptKey: z.string().optional(),
        cancelStatus: z.string(),
        cancelRequestId: z.string().optional(),
      })
    )
    .optional(),
  secret: z.string().optional(),
  type: z.string(),
  easyPay: z
    .object({
      provider: z.string(),
      amount: z.number(),
      discountAmount: z.number(),
    })
    .optional(),
  country: z.string().optional(),
  failure: z
    .object({
      code: z.string(),
      message: z.string(),
    })
    .optional(),
  isPartialCancelable: z.boolean(),
  receipt: z
    .object({
      url: z.string(),
    })
    .optional(),
  checkout: z
    .object({
      url: z.string(),
    })
    .optional(),
  currency: z.string(),
  totalAmount: z.number(),
  balanceAmount: z.number(),
  suppliedAmount: z.number(),
  vat: z.number(),
  taxFreeAmount: z.number(),
  method: z.string(),
  version: z.string(),
  metadata: z.record(z.string(), z.string()).optional(),
});

export type TossPaymentApprovalResponse = z.infer<typeof TossPaymentApprovalResponseSchema>;

// Toss Payments 에러 응답
export const TossPaymentErrorResponseSchema = z.object({
  code: z.string(),
  message: z.string(),
});

export type TossPaymentErrorResponse = z.infer<typeof TossPaymentErrorResponseSchema>;

// ============================================================
// Validation Helpers & Constants
// ============================================================

/**
 * 결제 금액 정의
 * 1크레딧 = 1장 생성 기준. 가격은 비즈니스 결정에 따라 추후 조정.
 */
export const PAYMENT_AMOUNTS = {
  PREMIUM_UPGRADE: 9900, // 9,900원
  AI_CREDITS: 1000, // 1,000원 / 1크레딧(1장)
  AI_CREDITS_BUNDLE: 8000, // 10크레딧(10장) 패키지 8,000원 (20% 할인)
} as const;

/**
 * 결제 타입별 크레딧 부여
 * 1크레딧 = 1장 생성
 */
export const CREDITS_GRANTED = {
  PREMIUM_UPGRADE: 10, // 프리미엄: 10크레딧(10장)
  AI_CREDITS: 1, // 단일: 1크레딧(1장)
  AI_CREDITS_BUNDLE: 10, // 번들: 10크레딧(10장)
} as const;

/**
 * 결제 타입별 금액 검증
 */
export const validatePaymentAmount = (
  type: PaymentType,
  amount: number
): boolean => {
  return PAYMENT_AMOUNTS[type] === amount;
};

/**
 * 결제 타입별 크레딧 계산
 */
export const calculateCredits = (type: PaymentType): number => {
  return CREDITS_GRANTED[type];
};

/**
 * 주문 ID 생성 (고유성 보장)
 */
export const generateOrderId = (userId: string, type: PaymentType): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${type}_${userId.slice(0, 8)}_${timestamp}_${random}`;
};
