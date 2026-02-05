import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { invitations, rsvps } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// DELETE /api/invitations/[id]/rsvp/[rsvpId] - 소유자용 RSVP 삭제
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; rsvpId: string }> }
) {
  try {
    const { id, rsvpId } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    // 청첩장 확인 + 소유권 체크
    const invitation = await db.query.invitations.findFirst({
      where: eq(invitations.id, id),
    });

    if (!invitation) {
      return NextResponse.json(
        { error: '청첩장을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    if (invitation.userId !== session.user.id) {
      return NextResponse.json(
        { error: '권한이 없습니다' },
        { status: 403 }
      );
    }

    // RSVP 확인 (해당 청첩장에 속하는지)
    const rsvp = await db.query.rsvps.findFirst({
      where: and(
        eq(rsvps.id, rsvpId),
        eq(rsvps.invitationId, id)
      ),
    });

    if (!rsvp) {
      return NextResponse.json(
        { error: 'RSVP를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // RSVP 삭제
    await db.delete(rsvps).where(eq(rsvps.id, rsvpId));

    return NextResponse.json({
      success: true,
      message: 'RSVP가 삭제되었습니다',
    });
  } catch (error) {
    console.error('RSVP 삭제 실패:', error);
    return NextResponse.json(
      { error: 'RSVP 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
