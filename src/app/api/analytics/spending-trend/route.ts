import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth-server";
import { startOfMonth, subMonths, format, eachDayOfInterval, endOfMonth, eachMonthOfInterval } from "date-fns";

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
    const since = startOfMonth(subMonths(now, months - 1));

    if (months > 12) {
      const rows = await prisma.$queryRaw<{ period: string; total: any }[]>`
        SELECT strftime('%Y-%m', datetime(timestamp/1000, 'unixepoch')) as period, SUM(amount) as total
        FROM "Transaction"
        WHERE userId = ${payload.userId} AND type = 'expense' AND timestamp >= ${since}
        GROUP BY strftime('%Y-%m', datetime(timestamp/1000, 'unixepoch'))
        ORDER BY period ASC
      `;

      const dataMap = new Map<string, number>();
      for (const r of rows) dataMap.set(r.period, toNum(r.total));

      const monthList = eachMonthOfInterval({ start: since, end: endOfMonth(now) });
      const trend = monthList.map((d) => ({
        date: format(d, "yyyy-MM-dd"),
        amount: dataMap.get(format(d, "yyyy-MM")) ?? 0,
      }));

      return NextResponse.json(trend, {
        headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=120" },
      });
    }

    const rows = await prisma.$queryRaw<{ period: string; total: any }[]>`
      SELECT strftime('%Y-%m-%d', datetime(timestamp/1000, 'unixepoch')) as period, SUM(amount) as total
      FROM "Transaction"
      WHERE userId = ${payload.userId} AND type = 'expense' AND timestamp >= ${since}
      GROUP BY strftime('%Y-%m-%d', datetime(timestamp/1000, 'unixepoch'))
      ORDER BY period ASC
    `;

    const dataMap = new Map<string, number>();
    for (const r of rows) dataMap.set(r.period, toNum(r.total));

    const days = eachDayOfInterval({ start: since, end: endOfMonth(now) });
    const trend = days.map((d) => ({
      date: format(d, "yyyy-MM-dd"),
      amount: dataMap.get(format(d, "yyyy-MM-dd")) ?? 0,
    }));

    return NextResponse.json(trend, {
      headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=120" },
    });
  } catch (error) {
    console.error("Spending trend error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
