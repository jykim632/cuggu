import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, sql, and } from 'drizzle-orm';

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
 * 크레딧 차감 (트랜잭션)
 *
 * @throws Error if insufficient credits or race condition
 */
export async function deductCredits(
  userId: string,
  amount: number = 1
): Promise<void> {
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
  await db
    .update(users)
    .set({
      aiCredits: sql`${users.aiCredits} + ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}
