import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { userId, resetToken, newPassword } = await request.json();

    if (!userId || !resetToken || !newPassword) {
      return NextResponse.json(
        { error: "UserId, resetToken, and newPassword are required" },
        { status: 400 }
      );
    }

    const session = await prisma.session.findUnique({
      where: { token: resetToken },
    });

    if (!session || session.userId !== userId) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 401 }
      );
    }

    if (new Date() > session.expiresAt) {
      await prisma.session.delete({ where: { id: session.id } });
      return NextResponse.json(
        { error: "Reset token has expired. Please start over." },
        { status: 401 }
      );
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      }),
      prisma.session.delete({
        where: { id: session.id },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password reset error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
