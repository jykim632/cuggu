import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const settingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = settingsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { emailNotifications } = validation.data;

    // 업데이트할 필드만 포함
    const updateData: Partial<typeof users.$inferInsert> = {};
    if (emailNotifications !== undefined) {
      updateData.emailNotifications = emailNotifications;
    }
    updateData.updatedAt = new Date();

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.email, session.user.email))
      .returning({
        emailNotifications: users.emailNotifications,
      });

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: "설정이 저장되었습니다",
    });
  } catch (error) {
    console.error("설정 업데이트 실패:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
