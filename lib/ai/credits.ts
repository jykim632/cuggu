import { db } from '@/db';
import { users, aiCreditTransactions } from '@/db/schema';
import { eq, sql, and, desc } from 'drizzle-orm';
import type { CreditTransaction } from '@/types/ai';

const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * 크레딧 잔액 확인
 */
export async function checkCredits(userId: string): Promise<{
  hasCredits: boolean;
  balance: number;
}> {
  // 개발 모드: 무제한 크레딧
  if (IS_DEV) {
    return {
      hasCredits: true,
      balance: 999,
    };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { aiCredits: true },
  });

  if (!user) throw new Error('User not found');

  return {
    hasCredits: user.aiCredits > 0,
    balance: user.aiCredits,
  };
}

/**
 * 크레딧 잔액 확인 (사용자 객체 직접 전달)
 */
export function checkCreditsFromUser(user: { aiCredits: number }): {
  hasCredits: boolean;
  balance: number;
} {
  // 개발 모드: 무제한 크레딧
  if (IS_DEV) {
    return {
      hasCredits: true,
      balance: 999,
    };
  }

  return {
    hasCredits: user.aiCredits > 0,
    balance: user.aiCredits,
  };
}

/**
 * 크레딧 차감 (트랜잭션)
 *
 * @throws Error if insufficient credits or race condition
 */
export async function deductCredits(
  userId: string,
  amount: number = 1
): Promise<void> {
  // 개발 모드: 크레딧 차감 스킵
  if (IS_DEV) {
    console.log(`[DEV] Skipping credit deduction: ${amount} credits`);
    return;
  }

  const result = await db
    .update(users)
    .set({
      aiCredits: sql`${users.aiCredits} - ${amount}`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(users.id, userId),
        sql`${users.aiCredits} >= ${amount}`
      )
    )
    .returning({ aiCredits: users.aiCredits });

  // 조건부 UPDATE이므로 잔액 부족 시 result가 비어있음
  if (result.length === 0) {
    throw new Error('Insufficient credits');
  }
}

/**
 * 크레딧 환불 (생성 실패 시)
 */
export async function refundCredits(
  userId: string,
  amount: number = 1
): Promise<void> {
  // 개발 모드: 환불 스킵
  if (IS_DEV) {
    console.log(`[DEV] Skipping credit refund: ${amount} credits`);
    return;
  }

  await db
    .update(users)
    .set({
      aiCredits: sql`${users.aiCredits} + ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

/**
 * 크레딧 선예약 (Job 생성 시)
 * 원자적 차감 + 거래 이력 기록
 */
export async function reserveCredits(
  userId: string,
  amount: number,
  jobId: string
): Promise<number> {
  // 개발 모드: 예약 스킵
  if (IS_DEV) {
    console.log(`[DEV] Skipping credit reservation: ${amount} credits for job ${jobId}`);
    return 999;
  }

  return await db.transaction(async (tx) => {
    // 1. 원자적 차감 (잔액 부족 시 빈 배열 반환)
    const result = await tx
      .update(users)
      .set({
        aiCredits: sql`${users.aiCredits} - ${amount}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(users.id, userId),
          sql`${users.aiCredits} >= ${amount}`
        )
      )
      .returning({ aiCredits: users.aiCredits });

    if (result.length === 0) {
      throw new Error('Insufficient credits');
    }

    const balanceAfter = result[0].aiCredits;

    // 2. 거래 이력 기록
    await tx.insert(aiCreditTransactions).values({
      userId,
      type: 'DEDUCT',
      amount,
      balanceAfter,
      referenceType: 'JOB',
      referenceId: jobId,
      description: `${amount}크레딧 예약`,
    });

    return balanceAfter;
  });
}

/**
 * 크레딧 환불 (미사용분 반환)
 * Job 실패/취소 시 미사용 크레딧 복구
 */
export async function releaseCredits(
  userId: string,
  amount: number,
  jobId: string
): Promise<number> {
  // 개발 모드: 환불 스킵
  if (IS_DEV) {
    console.log(`[DEV] Skipping credit release: ${amount} credits for job ${jobId}`);
    return 999;
  }

  return await db.transaction(async (tx) => {
    // 1. 크레딧 복구
    const result = await tx
      .update(users)
      .set({
        aiCredits: sql`${users.aiCredits} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({ aiCredits: users.aiCredits });

    if (result.length === 0) {
      throw new Error('User not found');
    }

    const balanceAfter = result[0].aiCredits;

    // 2. 거래 이력 기록
    await tx.insert(aiCreditTransactions).values({
      userId,
      type: 'REFUND',
      amount,
      balanceAfter,
      referenceType: 'JOB',
      referenceId: jobId,
      description: `${amount}크레딧 환불`,
    });

    return balanceAfter;
  });
}

/**
 * 크레딧 거래 이력 조회
 */
export async function getCreditHistory(
  userId: string,
  limit: number = 20
): Promise<CreditTransaction[]> {
  const rows = await db
    .select({
      id: aiCreditTransactions.id,
      type: aiCreditTransactions.type,
      amount: aiCreditTransactions.amount,
      balanceAfter: aiCreditTransactions.balanceAfter,
      referenceType: aiCreditTransactions.referenceType,
      referenceId: aiCreditTransactions.referenceId,
      description: aiCreditTransactions.description,
      createdAt: aiCreditTransactions.createdAt,
    })
    .from(aiCreditTransactions)
    .where(eq(aiCreditTransactions.userId, userId))
    .orderBy(desc(aiCreditTransactions.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
  }));
}
