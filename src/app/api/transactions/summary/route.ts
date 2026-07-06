import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth-server";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

export async function GET() {
  try {
    const payload = getAuthPayload();
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const [allTimeAgg, thisMonthTxs, lastMonthTxs] = await Promise.all([
      prisma.transaction.groupBy({
        by: ["type"],
        where: { userId: payload.userId },
        _sum: { amount: true },
      }),
      prisma.transaction.findMany({
        where: { userId: payload.userId, timestamp: { gte: monthStart, lte: monthEnd } },
        select: { amount: true, type: true },
      }),
      prisma.transaction.findMany({
        where: { userId: payload.userId, timestamp: { gte: lastMonthStart, lte: lastMonthEnd } },
        select: { amount: true, type: true },
      }),
    ]);

    const incomeTotal = allTimeAgg.find((a) => a.type === "income")?._sum.amount ?? 0;
    const expenseTotal = allTimeAgg.find((a) => a.type === "expense")?._sum.amount ?? 0;
    const balance = incomeTotal - expenseTotal;

    let thisIncome = 0;
    let thisExpense = 0;

    for (const tx of thisMonthTxs) {
      if (tx.type === "income") thisIncome += tx.amount;
      else thisExpense += tx.amount;
    }

    let lastIncome = 0;
    let lastExpense = 0;

    for (const tx of lastMonthTxs) {
      if (tx.type === "income") lastIncome += tx.amount;
      else lastExpense += tx.amount;
    }

    return NextResponse.json({
      balance,
      thisMonth: {
        income: thisIncome,
        expense: thisExpense,
        savings: thisIncome - thisExpense,
        savingsRate:
          thisIncome > 0
            ? ((thisIncome - thisExpense) / thisIncome) * 100
            : 0,
      },
      vsLastMonth: {
        incomeChange:
          lastIncome > 0
            ? ((thisIncome - lastIncome) / lastIncome) * 100
            : 0,
        expenseChange:
          lastExpense > 0
            ? ((thisExpense - lastExpense) / lastExpense) * 100
            : 0,
      },
    }, {
      headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=120" },
    });
  } catch (error) {
    console.error("Summary error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
