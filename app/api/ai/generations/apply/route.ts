import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users, invitations, aiGenerations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const ApplySchema = z.object({
  invitationId: z.string().min(1),
  imageUrls: z.array(z.string().url()).min(1).max(50),
});

/**
 * POST /api/ai/generations/apply
 * 선택한 AI 사진을 청첩장 galleryImages에 추가
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
    const parsed = ApplySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || '잘못된 요청' },
        { status: 400 }
      );
    }

    const { invitationId, imageUrls } = parsed.data;

    // Transaction으로 read-modify-write 원자성 보장
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
      if (newImages.length === 0) {
        return { addedCount: 0, totalCount: existing.size, inv };
      }

      const updatedImages = [...(inv.galleryImages ?? []), ...newImages];
      await tx
        .update(invitations)
        .set({
          galleryImages: updatedImages,
          updatedAt: new Date(),
        })
        .where(eq(invitations.id, invitationId));

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
    console.error('Apply to invitation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
