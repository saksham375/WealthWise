import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth-server";
import { startOfMonth, endOfMonth } from "date-fns";

export async function GET(request: Request) {
  try {
    const payload = getAuthPayload();
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const now = new Date();
    const month = parseInt(searchParams.get("month") ?? String(now.getMonth() + 1));
    const year = parseInt(searchParams.get("year") ?? String(now.getFullYear()));

    const monthStart = startOfMonth(new Date(year, month - 1, 1));
    const monthEnd = endOfMonth(monthStart);

    const budgets = await prisma.budget.findMany({
      where: { userId: payload.userId, month, year },
      include: { category: { select: { id: true, name: true, iconName: true } } },
    });

    const spentAgg = await prisma.transaction.groupBy({
      by: ["categoryId"],
      where: {
        userId: payload.userId,
        type: "expense",
        timestamp: { gte: monthStart, lte: monthEnd },
      },
      _sum: { amount: true },
    });

    const spentMap = new Map(spentAgg.map((a) => [a.categoryId, a._sum.amount ?? 0]));

    const budgetWithSpent = budgets.map((b) => {
      const spent = spentMap.get(b.categoryId) ?? 0;
      const percentage = b.limitAmount > 0 ? Math.round((spent / b.limitAmount) * 100) : 0;
      return {
        id: b.id,
        categoryId: b.categoryId,
        categoryName: b.category.name,
        iconName: b.category.iconName,
        limitAmount: b.limitAmount,
        spent,
        remaining: b.limitAmount - spent,
        percentage: Math.min(percentage, 100),
        isOverBudget: spent > b.limitAmount,
        applyEveryMonth: b.applyEveryMonth,
      };
    });

    return NextResponse.json(budgetWithSpent);
  } catch (error) {
    console.error("Get budgets error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = getAuthPayload();
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { categoryId, limitAmount, applyEveryMonth } = await request.json();
    if (!categoryId || !limitAmount) {
      return NextResponse.json({ error: "Category and limit are required" }, { status: 400 });
    }

    const now = new Date();
    const budget = await prisma.budget.create({
      data: {
        userId: payload.userId,
        categoryId,
        limitAmount,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        applyEveryMonth: applyEveryMonth ?? false,
      },
    });

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    console.error("Create budget error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
