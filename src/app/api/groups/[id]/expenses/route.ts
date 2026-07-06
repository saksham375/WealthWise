import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth-server";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const payload = getAuthPayload();
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const membership = await prisma.groupMember.findFirst({
      where: { groupId: params.id, userId: payload.userId },
    });
    if (!membership) return NextResponse.json({ error: "Not a member" }, { status: 403 });

    const { description, totalAmount, payerId, splitMethod, splits, date } = await request.json();
    if (!description || !totalAmount || !payerId || !splitMethod || !splits) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }

    const groupExpense = await prisma.groupExpense.create({
      data: {
        groupId: params.id,
        payerId,
        description,
        totalAmount,
        date: date ? new Date(date) : new Date(),
        splitMethod,
        splits: {
          create: splits.map((s: { userId: string; amount: number; percentage?: number }) => ({
            userId: s.userId,
            amount: s.amount,
            percentage: s.percentage ?? null,
            isSettled: false,
          })),
        },
      },
    });

    return NextResponse.json(groupExpense, { status: 201 });
  } catch (error) {
    console.error("Create expense error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
