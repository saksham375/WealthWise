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

    const { settlerUserId, receiverUserId, amount, method } = await request.json();
    if (!settlerUserId || !receiverUserId || !amount) {
      return NextResponse.json({ error: "Settler, receiver, and amount required" }, { status: 400 });
    }

    const settlement = await prisma.settlement.create({
      data: {
        groupId: params.id,
        settlerUserId,
        receiverUserId,
        amount,
        method: method ?? "cash",
      },
    });

    // Create linked transactions for both users
    const otherCategory = await prisma.category.findFirst({ where: { name: "Other Expense", isSystem: true } });
    const otherIncome = await prisma.category.findFirst({ where: { name: "Other Income", isSystem: true } });

    if (otherCategory && otherIncome) {
      await prisma.transaction.create({
        data: {
          userId: settlerUserId,
          categoryId: otherCategory.id,
          amount,
          type: "expense",
          description: `Settlement to ${(await prisma.user.findUnique({ where: { id: receiverUserId } }))?.name ?? "user"} (${(await prisma.group.findUnique({ where: { id: params.id } }))?.groupName ?? "group"})`,
          timestamp: new Date(),
        },
      });

      await prisma.transaction.create({
        data: {
          userId: receiverUserId,
          categoryId: otherIncome.id,
          amount,
          type: "income",
          description: `Settlement from ${(await prisma.user.findUnique({ where: { id: settlerUserId } }))?.name ?? "user"} (${(await prisma.group.findUnique({ where: { id: params.id } }))?.groupName ?? "group"})`,
          timestamp: new Date(),
        },
      });
    }

    return NextResponse.json(settlement, { status: 201 });
  } catch (error) {
    console.error("Settle error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
