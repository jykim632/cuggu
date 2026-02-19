import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users, payments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 사용자 ID 조회
    const user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
      columns: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // 결제 내역 조회 (최근 20개)
    const paymentHistory = await db.query.payments.findMany({
      where: eq(payments.userId, user.id),
      orderBy: [desc(payments.createdAt)],
      limit: 20,
      columns: {
        id: true,
        type: true,
        method: true,
        amount: true,
        creditsGranted: true,
        status: true,
        channel: true,
        orderId: true,
        createdAt: true,
      },
    });

    // 타입별 설명 매핑
    const typeDescriptions: Record<string, string> = {
      PREMIUM_UPGRADE: "프리미엄 플랜",
      AI_CREDITS: "AI 크레딧 1회",
      AI_CREDITS_BUNDLE: "AI 크레딧 10회 패키지",
    };

    const formattedHistory = paymentHistory.map((payment) => ({
      id: payment.id,
      date: payment.createdAt.toISOString(),
      amount: payment.amount,
      description:
        typeDescriptions[payment.type] || payment.type,
      status: payment.status,
      method: payment.method,
      channel: payment.channel,
      orderId: payment.orderId,
    }));

    return NextResponse.json({
      success: true,
      data: formattedHistory,
    });
  } catch (error) {
    console.error("결제 내역 조회 실패:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
