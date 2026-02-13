import { db } from '@/db';
import { aiCreditTransactions, users } from '@/db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth/admin';
import { withErrorHandler, successResponse, validateQuery } from '@/lib/api-utils';
import { z } from 'zod';

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(['DEDUCT', 'REFUND', 'PURCHASE', 'BONUS']).optional(),
  userId: z.string().optional(),
});

export const GET = withErrorHandler(async (req) => {
  await requireAdmin();

  const { page, pageSize, type, userId } = validateQuery(req, QuerySchema);
  const offset = (page - 1) * pageSize;

  const conditions = [];
  if (type) conditions.push(eq(aiCreditTransactions.type, type));
  if (userId) conditions.push(eq(aiCreditTransactions.userId, userId));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [transactions, [countResult], [statsResult]] = await Promise.all([
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
        userName: users.name,
        userEmail: users.email,
      })
      .from(aiCreditTransactions)
      .innerJoin(users, eq(aiCreditTransactions.userId, users.id))
      .where(whereClause)
      .orderBy(desc(aiCreditTransactions.createdAt))
      .limit(pageSize)
      .offset(offset),

    db
      .select({ count: sql<number>`count(*)::int` })
      .from(aiCreditTransactions)
      .where(whereClause),

    db
      .select({
        totalCount: sql<number>`count(*)::int`,
        totalDeducted: sql<number>`coalesce(sum(case when ${aiCreditTransactions.type} = 'DEDUCT' then ${aiCreditTransactions.amount} else 0 end), 0)::int`,
        totalRefunded: sql<number>`coalesce(sum(case when ${aiCreditTransactions.type} = 'REFUND' then ${aiCreditTransactions.amount} else 0 end), 0)::int`,
      })
      .from(aiCreditTransactions),
  ]);

  const total = countResult.count;

  return successResponse({
    transactions: transactions.map((tx) => ({
      ...tx,
      createdAt: tx.createdAt.toISOString(),
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
    stats: {
      totalCount: statsResult.totalCount,
      totalDeducted: statsResult.totalDeducted,
      totalRefunded: statsResult.totalRefunded,
    },
  });
});
