import { db } from '@/db';
import { aiGenerations, users } from '@/db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth/admin';
import { withErrorHandler, successResponse, validateQuery } from '@/lib/api-utils';
import { z } from 'zod';

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']).optional(),
});

export const GET = withErrorHandler(async (req) => {
  await requireAdmin();

  const { page, pageSize, status } = validateQuery(req, QuerySchema);
  const offset = (page - 1) * pageSize;

  const whereClause = status ? eq(aiGenerations.status, status) : undefined;

  const [generations, [countResult], [statsResult]] = await Promise.all([
    db
      .select({
        id: aiGenerations.id,
        style: aiGenerations.style,
        status: aiGenerations.status,
        providerType: aiGenerations.providerType,
        cost: aiGenerations.cost,
        creditsUsed: aiGenerations.creditsUsed,
        createdAt: aiGenerations.createdAt,
        userEmail: users.email,
        userName: users.name,
      })
      .from(aiGenerations)
      .innerJoin(users, eq(aiGenerations.userId, users.id))
      .where(whereClause)
      .orderBy(desc(aiGenerations.createdAt))
      .limit(pageSize)
      .offset(offset),

    db
      .select({ count: sql<number>`count(*)::int` })
      .from(aiGenerations)
      .where(whereClause),

    db
      .select({
        totalCount: sql<number>`count(*)::int`,
        totalCost: sql<number>`coalesce(sum(${aiGenerations.cost}), 0)::real`,
        failedCount: sql<number>`count(*) filter (where ${aiGenerations.status} = 'FAILED')::int`,
      })
      .from(aiGenerations),
  ]);

  const total = countResult.count;

  return successResponse({
    generations,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
    stats: {
      totalCount: statsResult.totalCount,
      totalCost: statsResult.totalCost,
      failRate: statsResult.totalCount > 0
        ? Math.round((statsResult.failedCount / statsResult.totalCount) * 100)
        : 0,
    },
  });
});
