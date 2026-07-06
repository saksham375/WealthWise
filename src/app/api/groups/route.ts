import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth-server";

export async function GET() {
  try {
    const payload = getAuthPayload();
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const memberships = await prisma.groupMember.findMany({
      where: { userId: payload.userId },
      include: {
        group: {
          include: {
            members: {
              include: { user: { select: { id: true, name: true, email: true } } },
            },
            expenses: {
              include: { splits: true, payer: { select: { id: true, name: true } } },
            },
            settlements: true,
          },
        },
      },
    });

    const groups = memberships.map((m) => {
      const g = m.group;
      const balanceMap: Record<string, number> = {};
      for (const member of g.members) {
        balanceMap[member.userId] = 0;
      }

      for (const exp of g.expenses) {
        balanceMap[exp.payerId] = (balanceMap[exp.payerId] ?? 0) + exp.totalAmount;
        for (const split of exp.splits) {
          balanceMap[split.userId] = (balanceMap[split.userId] ?? 0) - split.amount;
        }
      }

      for (const s of g.settlements) {
        balanceMap[s.settlerUserId] = (balanceMap[s.settlerUserId] ?? 0) + s.amount;
        balanceMap[s.receiverUserId] = (balanceMap[s.receiverUserId] ?? 0) - s.amount;
      }

      const myBalance = balanceMap[payload.userId] ?? 0;
      const lastActivity = g.expenses.length > 0
        ? g.expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
        : g.createdAt;

      return {
        id: g.id,
        groupName: g.groupName,
        emoji: g.emoji,
        memberCount: g.members.length,
        expenseCount: g.expenses.length,
        myBalance,
        lastActivity,
      };
    });

    return NextResponse.json(groups);
  } catch (error) {
    console.error("Get groups error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = getAuthPayload();
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { groupName, emoji, memberIds } = await request.json();
    if (!groupName) {
      return NextResponse.json({ error: "Group name is required" }, { status: 400 });
    }

    const memberIdSet = new Set([payload.userId, ...(memberIds ?? [])]);
    const allMembers = Array.from(memberIdSet);

    const group = await prisma.group.create({
      data: {
        groupName,
        emoji: emoji ?? "👥",
        createdById: payload.userId,
        members: {
          create: allMembers.map((uid) => ({
            userId: uid,
            role: uid === payload.userId ? "ADMIN" : "MEMBER",
          })),
        },
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error("Create group error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
