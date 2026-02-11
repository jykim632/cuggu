import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users, aiGenerations } from '@/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { z } from 'zod';

const QuerySchema = z.object({
  role: z.enum(['GROOM', 'BRIDE']).optional(),
  style: z.string().optional(),
  favorites: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
      columns: { id: true, aiCredits: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 쿼리 파라미터 파싱
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = QuerySchema.safeParse(params);
    if (!query.success) {
      return NextResponse.json({ error: '잘못된 쿼리 파라미터' }, { status: 400 });
    }

    const { role, style, favorites, page, limit } = query.data;

    // WHERE 조건 조합
    const conditions = [
      eq(aiGenerations.userId, user.id),
      eq(aiGenerations.status, 'COMPLETED'),
    ];

    if (role) {
      conditions.push(eq(aiGenerations.role, role));
    }
    if (style) {
      conditions.push(eq(aiGenerations.style, style as any));
    }
    if (favorites === 'true') {
      conditions.push(eq(aiGenerations.isFavorited, true));
    }

    const offset = (page - 1) * limit;

    // 데이터 + 총 개수 병렬 조회
    const [generations, [countResult]] = await Promise.all([
      db
        .select({
          id: aiGenerations.id,
          originalUrl: aiGenerations.originalUrl,
          style: aiGenerations.style,
          role: aiGenerations.role,
          generatedUrls: aiGenerations.generatedUrls,
          selectedUrl: aiGenerations.selectedUrl,
          isFavorited: aiGenerations.isFavorited,
          modelId: aiGenerations.modelId,
          cost: aiGenerations.cost,
          createdAt: aiGenerations.createdAt,
        })
        .from(aiGenerations)
        .where(and(...conditions))
        .orderBy(desc(aiGenerations.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(aiGenerations)
        .where(and(...conditions)),
    ]);

    const total = countResult?.count ?? 0;

    return NextResponse.json({
      success: true,
      data: generations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + limit < total,
      },
      remainingCredits: user.aiCredits,
    });
  } catch (error) {
    console.error('Get generations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
