import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users, aiAlbums, aiGenerations } from '@/db/schema';
import { eq, desc, and, sql, count } from 'drizzle-orm';
import { CreateAlbumSchema } from '@/schemas/ai';
import { createId } from '@paralleldrive/cuid2';

/**
 * POST /api/ai/albums — 앨범 생성 (유저당 1개 제한)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
      columns: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = CreateAlbumSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || '잘못된 요청' },
        { status: 400 }
      );
    }

    const defaultGroups = [
      { id: createId(), name: '기본 그룹', sortOrder: 0, isDefault: true },
    ];

    const [album] = await db
      .insert(aiAlbums)
      .values({
        userId: user.id,
        name: parsed.data.name,
        snapType: parsed.data.snapType,
        groups: defaultGroups,
      })
      .returning();

    return NextResponse.json({ success: true, data: album }, { status: 201 });
  } catch (error) {
    console.error('Create album error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/ai/albums — 내 앨범 목록 (MVP: 1개)
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
      columns: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const albums = await db
      .select()
      .from(aiAlbums)
      .where(eq(aiAlbums.userId, user.id))
      .orderBy(desc(aiAlbums.createdAt));

    // 앨범별 완료된 generation 수를 단일 쿼리로 조회 (N+1 제거)
    const albumIds = albums.map((a) => a.id);

    type GenerationRow = {
      id: string;
      albumId: string | null;
      style: string;
      role: string | null;
      generatedUrls: string[] | null;
      createdAt: Date;
    };
    let generationsByAlbum: Record<string, GenerationRow[]> = {};

    if (albumIds.length > 0) {
      const generations = await db
        .select({
          id: aiGenerations.id,
          albumId: aiGenerations.albumId,
          style: aiGenerations.style,
          role: aiGenerations.role,
          generatedUrls: aiGenerations.generatedUrls,
          createdAt: aiGenerations.createdAt,
        })
        .from(aiGenerations)
        .where(
          and(
            sql`${aiGenerations.albumId} IN (${sql.join(albumIds.map(id => sql`${id}`), sql`, `)})`,
            eq(aiGenerations.status, 'COMPLETED')
          )
        )
        .orderBy(desc(aiGenerations.createdAt));

      // 앨범별로 그룹핑
      for (const gen of generations) {
        const key = gen.albumId ?? '__none__';
        if (!generationsByAlbum[key]) generationsByAlbum[key] = [];
        generationsByAlbum[key].push(gen);
      }
    }

    const albumsWithGenerations = albums.map((album) => ({
      ...album,
      generations: generationsByAlbum[album.id] ?? [],
    }));

    return NextResponse.json({ success: true, data: albumsWithGenerations });
  } catch (error) {
    console.error('Get albums error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
