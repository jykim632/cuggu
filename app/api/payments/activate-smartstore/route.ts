import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { rateLimit } from '@/lib/rate-limit';
import { ActivateSmartStoreRequestSchema, validatePaymentAmount } from '@/schemas/payment';
import { verifyOrder, dispatchOrder, VerifyError } from '@/lib/payments/smartstore';
import { grantPaymentRewards } from '@/lib/payments/grant';

export async function POST(req: Request) {
  try {
    // 1. 인증 확인
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    // 2. 사용자 ID 조회
    const user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
      columns: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 3. Rate limit — 5회/5분/유저
    const { allowed } = await rateLimit(
      `smartstore:activate:${user.id}`,
      5,
      300
    );
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: '요청이 너무 많습니다. 잠시 후 다시 시도하세요.' },
        { status: 429 }
      );
    }

    // 4. 입력 검증
    const body = await req.json();
    const parsed = ActivateSmartStoreRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { productOrderId } = parsed.data;

    // 5. Commerce API 주문 검증
    let orderResult;
    try {
      orderResult = await verifyOrder(productOrderId);
    } catch (err) {
      if (err instanceof VerifyError) {
        return NextResponse.json(
          { success: false, error: err.message, code: err.code },
          { status: 400 }
        );
      }
      throw err;
    }

    // 6. 금액 검증
    if (!validatePaymentAmount(orderResult.paymentType, orderResult.amount)) {
      return NextResponse.json(
        { success: false, error: '결제 금액이 일치하지 않습니다' },
        { status: 400 }
      );
    }

    // 7. 보상 지급
    let grantResult;
    try {
      grantResult = await grantPaymentRewards({
        userId: user.id,
        paymentType: orderResult.paymentType,
        amount: orderResult.amount,
        channel: 'SMARTSTORE',
        externalOrderId: productOrderId,
      });
    } catch (err) {
      if (err instanceof Error && err.message === 'ALREADY_ACTIVATED') {
        return NextResponse.json(
          { success: false, error: '이미 활성화된 주문입니다' },
          { status: 409 }
        );
      }
      throw err;
    }

    // 8. 발송 처리 (fire-and-forget)
    dispatchOrder(productOrderId).catch((err) => {
      console.error('발송 처리 실패 (무시):', err);
    });

    return NextResponse.json({
      success: true,
      data: {
        creditsGranted: grantResult.creditsGranted,
        premiumUpgraded: grantResult.premiumUpgraded,
        productName: orderResult.productName,
      },
    });
  } catch (error) {
    console.error('스마트스토어 활성화 실패:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
