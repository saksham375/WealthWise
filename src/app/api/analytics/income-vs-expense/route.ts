import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth-server";
import { startOfMonth, subMonths, format } from "date-fns";

const toNum = (v: any) => Number(v ?? 0);

export async function GET(request: Request) {
  try {
    const payload = getAuthPayload();
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get("months") ?? "6");

    const now = new Date();
    const oldestStart = startOfMonth(subMonths(now, months - 1));

    if (months > 24) {
      const rows = await prisma.$queryRaw<{ period: string; income: any; expense: any }[]>`
        SELECT
          strftime('%Y', datetime(timestamp/1000, 'unixepoch')) as period,
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
        FROM "Transaction"
        WHERE userId = ${payload.userId} AND timestamp >= ${oldestStart}
        GROUP BY strftime('%Y', datetime(timestamp/1000, 'unixepoch'))
        ORDER BY period ASC
      `;
      return NextResponse.json(rows.map(r => ({ month: r.period, income: toNum(r.income), expense: toNum(r.expense) })), {
        headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=120" },
      });
    }

    const monthKey = (d: Date) => format(d, "yyyy-MM");
    const monthLabel = (d: Date) => format(d, "MMM");

    const rows = await prisma.$queryRaw<{ period: string; income: any; expense: any }[]>`
      SELECT
        strftime('%Y-%m', datetime(timestamp/1000, 'unixepoch')) as period,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
      FROM "Transaction"
      WHERE userId = ${payload.userId} AND timestamp >= ${oldestStart}
      GROUP BY strftime('%Y-%m', datetime(timestamp/1000, 'unixepoch'))
      ORDER BY period ASC
    `;

    const dataMap = new Map<string, { income: number; expense: number }>();
    for (const r of rows) {
      dataMap.set(r.period, { income: toNum(r.income), expense: toNum(r.expense) });
    }

    const data: { month: string; income: number; expense: number }[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const m = startOfMonth(subMonths(now, i));
      const key = monthKey(m);
      const entry = dataMap.get(key) ?? { income: 0, expense: 0 };
      data.push({ month: monthLabel(m), income: entry.income, expense: entry.expense });
    }

    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=120" },
    });
  } catch (error) {
    console.error("Income vs expense error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
