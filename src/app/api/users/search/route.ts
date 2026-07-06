import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth-server";

export async function GET(request: Request) {
  try {
    const payload = getAuthPayload();
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");

    if (!q || q.length < 2) {
      return NextResponse.json([]);
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { email: { contains: q.toLowerCase() } },
        ],
        NOT: { id: payload.userId }, // Exclude self
      },
      select: { id: true, name: true, email: true, avatarPath: true },
      take: 10,
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Search users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
