import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users, invitations, aiGenerations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const ApplySchema = z.object({
  invitationId: z.string().min(1),
  imageUrls: z.array(z.string().url()).min(1).max(10),
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

    // 청첩장 조회 (본인 소유 확인)
    const invitation = await db.query.invitations.findFirst({
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

    if (!invitation) {
      return NextResponse.json({ error: '청첩장을 찾을 수 없습니다' }, { status: 404 });
    }

    // 기존 갤러리에 append (중복 제거)
    const existingImages = invitation.galleryImages ?? [];
    const newImages = imageUrls.filter((url) => !existingImages.includes(url));
    const updatedImages = [...existingImages, ...newImages];

    await db
      .update(invitations)
      .set({
        galleryImages: updatedImages,
        updatedAt: new Date(),
      })
      .where(eq(invitations.id, invitationId));

    return NextResponse.json({
      success: true,
      data: {
        addedCount: newImages.length,
        totalCount: updatedImages.length,
        invitationName: `${invitation.groomName} ♥ ${invitation.brideName}`,
      },
    });
  } catch (error) {
    console.error('Apply to invitation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
