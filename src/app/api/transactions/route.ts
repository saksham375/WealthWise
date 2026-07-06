import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth-server";

export async function DELETE() {
  try {
    const payload = getAuthPayload();
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = payload.userId;

    const [txCount, budgetCount, goalCount, subCount, catCount, notifCount, memberCount] = await prisma.$transaction([
      prisma.transaction.deleteMany({ where: { userId } }),
      prisma.budget.deleteMany({ where: { userId } }),
      prisma.goal.deleteMany({ where: { userId } }),
      prisma.subscription.deleteMany({ where: { userId } }),
      prisma.category.deleteMany({ where: { userId, isSystem: false } }),
      prisma.notification.deleteMany({ where: { userId } }),
      prisma.groupMember.deleteMany({ where: { userId } }),
    ]);

    return NextResponse.json({
      deleted: {
        transactions: txCount.count,
        budgets: budgetCount.count,
        goals: goalCount.count,
        subscriptions: subCount.count,
        customCategories: catCount.count,
        notifications: notifCount.count,
        groupMemberships: memberCount.count,
      },
    });
  } catch (error) {
    console.error("Delete all data error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const payload = getAuthPayload();
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") ?? "50");
    const filter = searchParams.get("filter");
    const categoryId = searchParams.get("categoryId");

    const now = new Date();
    let dateFilter: Date | undefined;

    if (filter === "this_month") {
      dateFilter = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (filter === "this_year") {
      dateFilter = new Date(now.getFullYear(), 0, 1);
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: payload.userId,
        ...(dateFilter ? { timestamp: { gte: dateFilter } } : {}),
        ...(categoryId ? { categoryId } : {}),
      },
      include: {
        category: { select: { name: true, iconName: true } },
      },
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Get transactions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = getAuthPayload();
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { amount, type, categoryId, description, timestamp, isRecurring, recurringFrequency } = body;

    if (amount == null || !type || !categoryId) {
      return NextResponse.json({ error: "Missing required fields: amount, type, categoryId" }, { status: 400 });
    }

    let recurringId: string | undefined;
    if (isRecurring && recurringFrequency) {
      const schedule = await prisma.recurringSchedule.create({
        data: {
          userId: payload.userId,
          templateTitle: description || "Recurring transaction",
          amount: parseFloat(amount),
          type,
          categoryId,
          frequency: recurringFrequency,
          nextRunDate: timestamp ? new Date(timestamp) : new Date(),
          isActive: true,
        },
      });
      recurringId = schedule.id;
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: payload.userId,
        categoryId,
        amount: parseFloat(amount),
        type,
        description: description || null,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        isRecurring: isRecurring || false,
        recurringId: recurringId || null,
      },
      include: {
        category: { select: { name: true, iconName: true } },
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("Create transaction error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
