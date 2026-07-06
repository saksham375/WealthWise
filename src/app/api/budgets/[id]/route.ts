import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth-server";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const payload = getAuthPayload();
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { limitAmount, categoryId } = await request.json();

    const budget = await prisma.budget.findFirst({
      where: { id: params.id, userId: payload.userId },
    });
    if (!budget) return NextResponse.json({ error: "Budget not found" }, { status: 404 });

    const updated = await prisma.budget.update({
      where: { id: params.id },
      data: { ...(limitAmount && { limitAmount }), ...(categoryId && { categoryId }) },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update budget error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const payload = getAuthPayload();
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const budget = await prisma.budget.findFirst({
      where: { id: params.id, userId: payload.userId },
    });
    if (!budget) return NextResponse.json({ error: "Budget not found" }, { status: 404 });

    await prisma.budget.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete budget error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
