import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users, aiAlbums, invitations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { ApplyAlbumSchema } from '@/schemas/ai';

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/ai/albums/[id]/apply — 앨범을 청첩장 갤러리에 적용
 */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
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

    // 앨범 소유권 확인
    const album = await db.query.aiAlbums.findFirst({
      where: and(eq(aiAlbums.id, id), eq(aiAlbums.userId, user.id)),
    });

    if (!album) {
      return NextResponse.json({ error: '앨범을 찾을 수 없습니다' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = ApplyAlbumSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || '잘못된 요청' },
        { status: 400 }
      );
    }

    const { invitationId } = parsed.data;

    // 앨범 images에서 URL 추출
    const albumImages = (album.images ?? []) as Array<{ url: string }>;
    const imageUrls = albumImages.map((img) => img.url);

    if (imageUrls.length === 0) {
      return NextResponse.json({ error: '앨범에 선택된 이미지가 없습니다' }, { status: 400 });
    }

    // Transaction으로 갤러리 업데이트 + 앨범 상태 변경 원자성 보장
    const result = await db.transaction(async (tx) => {
      const inv = await tx.query.invitations.findFirst({
        where: and(
          eq(invitations.id, invitationId),
          eq(invitations.userId, user.id)
        ),
        columns: {
          id: true,
          galleryImages: true,
          groomName: true,
          brideName: true,
        },
      });

      if (!inv) return null;

      const existing = new Set(inv.galleryImages ?? []);
      const newImages = imageUrls.filter((url) => !existing.has(url));

      const updatedImages = newImages.length > 0
        ? [...(inv.galleryImages ?? []), ...newImages]
        : (inv.galleryImages ?? []);

      if (newImages.length > 0) {
        await tx.update(invitations).set({
          galleryImages: updatedImages,
          updatedAt: new Date(),
        }).where(eq(invitations.id, invitationId));
      }

      await tx.update(aiAlbums).set({
        status: 'applied',
        invitationId,
        updatedAt: new Date(),
      }).where(eq(aiAlbums.id, id));

      return { addedCount: newImages.length, totalCount: updatedImages.length, inv };
    });

    if (!result) {
      return NextResponse.json({ error: '청첩장을 찾을 수 없습니다' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        addedCount: result.addedCount,
        totalCount: result.totalCount,
        invitationName: `${result.inv.groomName} ♥ ${result.inv.brideName}`,
      },
    });
  } catch (error) {
    console.error('Apply album error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
