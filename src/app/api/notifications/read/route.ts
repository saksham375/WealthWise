import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth-server";

export async function POST() {
  try {
    const payload = getAuthPayload();
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await prisma.notification.updateMany({
      where: { userId: payload.userId, read: false },
      data: { read: true },
    });

    return NextResponse.json({ markedRead: result.count });
  } catch (error) {
    console.error("Mark notifications read error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
