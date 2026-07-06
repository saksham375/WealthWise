import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth-server";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const payload = getAuthPayload();
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existing = await prisma.transaction.findFirst({
      where: { id: params.id, userId: payload.userId },
    });
    if (!existing) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

    const body = await request.json();
    const { amount, type, categoryId, description, timestamp, isRecurring } = body;

    const updated = await prisma.transaction.update({
      where: { id: params.id },
      data: {
        ...(amount != null && { amount: parseFloat(amount) }),
        ...(type && { type }),
        ...(categoryId && { categoryId }),
        ...(description !== undefined && { description: description || null }),
        ...(timestamp && { timestamp: new Date(timestamp) }),
        ...(isRecurring !== undefined && { isRecurring }),
      },
      include: {
        category: { select: { name: true, iconName: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update transaction error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const payload = getAuthPayload();
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existing = await prisma.transaction.findFirst({
      where: { id: params.id, userId: payload.userId },
    });
    if (!existing) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

    await prisma.transaction.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete transaction error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
