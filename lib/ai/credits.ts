import { db } from '@/db';
import { users, aiCreditTransactions } from '@/db/schema';
import { eq, sql, and, desc } from 'drizzle-orm';
import type { CreditTransaction } from '@/types/ai';

/**
 * 크레딧 잔액 확인
 */
export async function checkCredits(userId: string): Promise<{
  hasCredits: boolean;
  balance: number;
}> {
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
  return {
    hasCredits: user.aiCredits > 0,
    balance: user.aiCredits,
  };
}

export interface CreditTxOptions {
  referenceType?: string;   // 'GENERATION' | 'THEME' | 'JOB' etc.
  referenceId?: string;
  description?: string;
}

/**
 * 크레딧 차감 (트랜잭션 + 감사 추적)
 *
 * @returns balanceAfter — 차감 후 잔액
 * @throws Error if insufficient credits or race condition
 */
export async function deductCredits(
  userId: string,
  amount: number = 1,
  options?: CreditTxOptions
): Promise<number> {
  return await db.transaction(async (tx) => {
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

    await tx.insert(aiCreditTransactions).values({
      userId,
      type: 'DEDUCT',
      amount,
      balanceAfter,
      referenceType: options?.referenceType ?? null,
      referenceId: options?.referenceId ?? null,
      description: options?.description ?? `크레딧 차감 (${amount}장)`,
    });

    return balanceAfter;
  });
}

/**
 * 크레딧 환불 (생성 실패 시, 감사 추적 포함)
 *
 * @returns balanceAfter — 환불 후 잔액
 */
export async function refundCredits(
  userId: string,
  amount: number = 1,
  options?: CreditTxOptions
): Promise<number> {
  return await db.transaction(async (tx) => {
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

    await tx.insert(aiCreditTransactions).values({
      userId,
      type: 'REFUND',
      amount,
      balanceAfter,
      referenceType: options?.referenceType ?? null,
      referenceId: options?.referenceId ?? null,
      description: options?.description ?? `크레딧 환불 (${amount}장)`,
    });

    return balanceAfter;
  });
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
      description: `AI 사진 배치 생성 (${amount}장)`,
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
      description: `배치 생성 미사용분 환불 (${amount}장)`,
    });

    return balanceAfter;
  });
}

/**
 * 크레딧 거래 이력 조회 (페이지네이션 지원)
 */
export async function getCreditHistory(
  userId: string,
  options: { page?: number; pageSize?: number } = {}
): Promise<{ transactions: CreditTransaction[]; total: number }> {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 10;
  const offset = (page - 1) * pageSize;

  const whereClause = eq(aiCreditTransactions.userId, userId);

  const [rows, [countResult]] = await Promise.all([
    db
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
      .where(whereClause)
      .orderBy(desc(aiCreditTransactions.createdAt))
      .limit(pageSize)
      .offset(offset),

    db
      .select({ count: sql<number>`count(*)::int` })
      .from(aiCreditTransactions)
      .where(whereClause),
  ]);

  return {
    transactions: rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    })),
    total: countResult.count,
  };
}
