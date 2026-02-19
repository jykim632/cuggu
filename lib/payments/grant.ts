import { db } from '@/db';
import { users, payments, aiCreditTransactions } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import type { PaymentType, PaymentChannel } from '@/schemas/payment';
import { calculateCredits, PAYMENT_AMOUNTS } from '@/schemas/payment';

// ============================================================
// 결제 보상 지급 (atomic transaction)
// ============================================================

export interface GrantPaymentRewardsInput {
  userId: string;
  paymentType: PaymentType;
  amount: number;
  channel: PaymentChannel;
  externalOrderId?: string; // 스마트스토어 상품주문번호
}

export interface GrantPaymentRewardsResult {
  creditsGranted: number;
  premiumUpgraded: boolean;
  paymentId: string;
}

/**
 * 결제 완료 시 보상 지급 — 단일 DB 트랜잭션
 *
 * 1. INSERT payments (COMPLETED, smartstoreOrderId UNIQUE)
 * 2. UPDATE users.aiCredits (atomic SQL)
 * 3. PREMIUM_UPGRADE면 premiumPlan 업그레이드
 * 4. INSERT aiCreditTransactions
 *
 * @throws Error('ALREADY_ACTIVATED') — smartstoreOrderId UNIQUE 위반
 */
export async function grantPaymentRewards(
  input: GrantPaymentRewardsInput
): Promise<GrantPaymentRewardsResult> {
  const { userId, paymentType, amount, channel, externalOrderId } = input;
  const creditsToGrant = calculateCredits(paymentType);
  const isPremium = paymentType === 'PREMIUM_UPGRADE';

  return await db.transaction(async (tx) => {
    // 1. payments 레코드 생성
    let paymentResult;
    try {
      [paymentResult] = await tx
        .insert(payments)
        .values({
          userId,
          type: paymentType,
          method: 'NAVER_PAY',
          amount,
          creditsGranted: creditsToGrant,
          status: 'COMPLETED',
          channel,
          smartstoreOrderId: externalOrderId ?? null,
        })
        .returning({ id: payments.id });
    } catch (err: unknown) {
      // UNIQUE 위반 = 이미 활성화된 주문
      if (
        err instanceof Error &&
        err.message.includes('unique') ||
        (err instanceof Error && err.message.includes('duplicate'))
      ) {
        throw new Error('ALREADY_ACTIVATED');
      }
      throw err;
    }

    // 2. 크레딧 지급 (atomic SQL)
    const userResult = await tx
      .update(users)
      .set({
        aiCredits: sql`${users.aiCredits} + ${creditsToGrant}`,
        ...(isPremium ? { premiumPlan: 'PREMIUM' as const } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({ aiCredits: users.aiCredits });

    if (userResult.length === 0) {
      throw new Error('User not found');
    }

    const balanceAfter = userResult[0].aiCredits;

    // 3. 크레딧 거래 이력
    await tx.insert(aiCreditTransactions).values({
      userId,
      type: 'PURCHASE',
      amount: creditsToGrant,
      balanceAfter,
      referenceType: 'PAYMENT',
      referenceId: paymentResult.id,
      description: isPremium
        ? `프리미엄 업그레이드 (${creditsToGrant}크레딧 포함)`
        : `AI 크레딧 구매 (${creditsToGrant}장)`,
    });

    return {
      creditsGranted: creditsToGrant,
      premiumUpgraded: isPremium,
      paymentId: paymentResult.id,
    };
  });
}
