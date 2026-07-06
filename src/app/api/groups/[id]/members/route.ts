import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth-server";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const payload = getAuthPayload();
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const membership = await prisma.groupMember.findFirst({
      where: { groupId: params.id, userId: payload.userId, role: "ADMIN" },
    });
    if (!membership) return NextResponse.json({ error: "Only admins can add members" }, { status: 403 });

    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 });

    const existing = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: params.id, userId } },
    });
    if (existing) return NextResponse.json({ error: "Already a member" }, { status: 409 });

    const member = await prisma.groupMember.create({
      data: { groupId: params.id, userId, role: "MEMBER" },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error("Add member error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const payload = getAuthPayload();
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") ?? payload.userId;

    if (userId !== payload.userId) {
      const membership = await prisma.groupMember.findFirst({
        where: { groupId: params.id, userId: payload.userId, role: "ADMIN" },
      });
      if (!membership) return NextResponse.json({ error: "Only admins can remove others" }, { status: 403 });
    }

    await prisma.groupMember.delete({
      where: { groupId_userId: { groupId: params.id, userId } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove member error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
