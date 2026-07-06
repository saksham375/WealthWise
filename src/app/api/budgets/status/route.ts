import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth-server";
import { startOfMonth, endOfMonth } from "date-fns";
import { generateSuggestion } from "@/lib/budget-suggestions";

export async function GET() {
  try {
    const payload = getAuthPayload();
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const budgets = await prisma.budget.findMany({
      where: { userId: payload.userId, month: now.getMonth() + 1, year: now.getFullYear() },
      include: { category: true },
    });

    const allTransactions = await prisma.transaction.findMany({
      where: {
        userId: payload.userId,
        type: "expense",
        timestamp: { gte: monthStart, lte: monthEnd },
      },
      include: { category: true },
    });

    const statuses = budgets.map((b) => {
      const spent = allTransactions
        .filter((t) => t.categoryId === b.categoryId)
        .reduce((s, t) => s + t.amount, 0);
      const percentage = b.limitAmount > 0 ? (spent / b.limitAmount) * 100 : 0;
      const suggestion = generateSuggestion(
        { id: b.categoryId, name: b.category.name, limitAmount: b.limitAmount },
        budgets.map((bb) => ({
          categoryId: bb.categoryId,
          categoryName: bb.category.name,
          limitAmount: bb.limitAmount,
        })),
        allTransactions
      );

      return {
        id: b.id,
        spent,
        limit: b.limitAmount,
        percentage: Math.round(percentage * 100) / 100,
        suggestion,
        status: percentage >= 100 ? "over" : percentage >= 80 ? "warning" : "on_track",
      };
    });

    const totals = {
      totalBudget: budgets.reduce((s, b) => s + b.limitAmount, 0),
      totalSpent: statuses.reduce((s, b) => s + b.spent, 0),
      totalRemaining: budgets.reduce((s, b) => s + b.limitAmount, 0) - statuses.reduce((s, b) => s + b.spent, 0),
    };

    return NextResponse.json({ budgets: statuses, totals });
  } catch (error) {
    console.error("Budget status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
