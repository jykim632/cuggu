import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invitations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

// POST /api/invitations/[id]/verify - 비밀번호 검증
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { password } = await req.json();

    if (!password) {
      return NextResponse.json(
        { error: '비밀번호를 입력하세요' },
        { status: 400 }
      );
    }

    // 청첩장 조회
    const invitation = await db.query.invitations.findFirst({
      where: eq(invitations.id, id),
    });

    if (!invitation) {
      return NextResponse.json(
        { error: '청첩장을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 비밀번호 보호 확인
    if (!invitation.isPasswordProtected || !invitation.passwordHash) {
      return NextResponse.json(
        { error: '비밀번호가 설정되지 않았습니다' },
        { status: 400 }
      );
    }

    // 비밀번호 검증
    const isValid = await bcrypt.compare(password, invitation.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { error: '비밀번호가 올바르지 않습니다' },
        { status: 401 }
      );
    }

    // 검증 성공 - 쿠키 설정 (24시간 유효)
    const cookieStore = await cookies();
    cookieStore.set(`invitation_${id}_verified`, 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24시간
    });

    return NextResponse.json({
      success: true,
      message: '비밀번호 확인 완료',
    });
  } catch (error) {
    console.error('비밀번호 검증 실패:', error);
    return NextResponse.json(
      { error: '비밀번호 검증 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
