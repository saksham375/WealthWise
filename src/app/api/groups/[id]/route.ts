import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth-server";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const payload = getAuthPayload();
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const membership = await prisma.groupMember.findFirst({
      where: { groupId: params.id, userId: payload.userId },
    });
    if (!membership) return NextResponse.json({ error: "Not a member" }, { status: 403 });

    const group = await prisma.group.findUnique({
      where: { id: params.id },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true, avatarPath: true } } },
        },
        expenses: {
          include: {
            payer: { select: { id: true, name: true } },
            splits: {
              include: { user: { select: { id: true, name: true } } },
            },
          },
          orderBy: { date: "desc" },
        },
        settlements: {
          include: {
            settler: { select: { id: true, name: true } },
            receiver: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    // Compute balances
    const balanceMap: Record<string, number> = {};
    for (const member of group.members) {
      balanceMap[member.userId] = 0;
    }

    for (const exp of group.expenses) {
      balanceMap[exp.payerId] = (balanceMap[exp.payerId] ?? 0) + exp.totalAmount;
      for (const split of exp.splits) {
        balanceMap[split.userId] = (balanceMap[split.userId] ?? 0) - split.amount;
      }
    }

    for (const s of group.settlements) {
      balanceMap[s.settlerUserId] = (balanceMap[s.settlerUserId] ?? 0) + s.amount;
      balanceMap[s.receiverUserId] = (balanceMap[s.receiverUserId] ?? 0) - s.amount;
    }

    const balances = group.members.map((m) => ({
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      avatarPath: m.user.avatarPath,
      balance: Math.round((balanceMap[m.userId] ?? 0) * 100) / 100,
    }));

    return NextResponse.json({
      ...group,
      balances,
    });
  } catch (error) {
    console.error("Get group error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
