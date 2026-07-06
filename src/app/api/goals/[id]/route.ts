import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth-server";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const payload = getAuthPayload();
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const goal = await prisma.goal.findFirst({
      where: { id: params.id, userId: payload.userId },
    });
    if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

    const { goalName, emoji, targetAmount, deadline } = await request.json();
    const updated = await prisma.goal.update({
      where: { id: params.id },
      data: {
        ...(goalName && { goalName }),
        ...(emoji && { emoji }),
        ...(targetAmount && { targetAmount }),
        ...(deadline && { deadline: new Date(deadline) }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update goal error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const payload = getAuthPayload();
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const goal = await prisma.goal.findFirst({
      where: { id: params.id, userId: payload.userId },
    });
    if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

    await prisma.goal.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete goal error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
