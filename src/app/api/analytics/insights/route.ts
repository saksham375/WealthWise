import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth-server";
import { runInsightsEngine } from "@/lib/insights-engine";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

export async function GET(request: Request) {
  try {
    const payload = getAuthPayload();
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get("months") ?? "1");

    const now = new Date();
    const since = subMonths(startOfMonth(now), months - 1);

    const now_date = new Date();
    const currentMonth = now_date.getMonth() + 1;
    const currentYear = now_date.getFullYear();
    const monthStart = startOfMonth(now_date);
    const monthEnd = endOfMonth(now_date);

    const [transactions, budgets, goals, subscriptions, spentAgg] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId: payload.userId, timestamp: { gte: since } },
        include: { category: { select: { name: true, iconName: true } } },
        orderBy: { timestamp: "desc" },
      }),
      prisma.budget.findMany({
        where: { userId: payload.userId, month: currentMonth, year: currentYear },
        include: {
          category: { select: { name: true } },
        },
      }),
      prisma.goal.findMany({
        where: { userId: payload.userId },
        select: {
          id: true,
          goalName: true,
          targetAmount: true,
          currentSaved: true,
          deadline: true,
          isCompleted: true,
        },
      }),
      prisma.subscription.findMany({
        where: { userId: payload.userId, isActive: true },
        select: {
          id: true,
          name: true,
          amount: true,
        },
      }),
      prisma.transaction.groupBy({
        by: ["categoryId"],
        where: {
          userId: payload.userId,
          type: "expense",
          timestamp: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      }),
    ]);

    const mapped = transactions.map((t) => ({
      id: t.id,
      amount: t.amount,
      type: t.type,
      description: t.description,
      timestamp: t.timestamp,
      categoryId: t.categoryId,
      isRecurring: t.isRecurring,
      category: { name: t.category.name, iconName: t.category.iconName },
    }));

    const spentMap = new Map(spentAgg.map((a) => [a.categoryId, a._sum.amount ?? 0]));

    const budgetData = budgets.map((b) => ({
      id: b.id,
      name: b.category?.name || "Budget",
      limitAmount: b.limitAmount,
      spent: spentMap.get(b.categoryId) ?? 0,
    }));

    const goalData = goals.map((g) => ({
      id: g.id,
      goalName: g.goalName,
      targetAmount: g.targetAmount,
      currentSaved: g.currentSaved,
      deadline: g.deadline.toISOString(),
      isCompleted: g.isCompleted,
    }));

    const subData = subscriptions.map((s) => ({
      id: s.id,
      name: s.name,
      amount: s.amount,
    }));

    const result = runInsightsEngine(mapped, months, {
      budgets: budgetData,
      goals: goalData,
      subscriptions: subData,
    });

    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=120" },
    });
  } catch (error) {
    console.error("Insights error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
