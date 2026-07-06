import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth-server";
import { startOfMonth, endOfMonth, format, eachDayOfInterval, subMonths } from "date-fns";

const toNum = (v: any) => Number(v ?? 0);

interface HeatmapDay {
  date: string;
  dayOfWeek: number;
  week: number;
  amount: number;
  intensity: number;
}

interface MonthData {
  label: string;
  data: HeatmapDay[];
  maxAmount: number;
}

export async function GET(request: Request) {
  try {
    const payload = getAuthPayload();
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    let monthCount: number;
    const monthsParam = searchParams.get("months");
    const monthOffsetParam = searchParams.get("monthOffset");

    if (monthsParam) {
      monthCount = parseInt(monthsParam);
    } else if (monthOffsetParam) {
      monthCount = parseInt(monthOffsetParam) === 0 ? 1 : 1;
    } else {
      monthCount = 1;
    }

    if (monthCount > 24) monthCount = 24;

    const now = new Date();
    const months: MonthData[] = [];

    for (let i = 0; i < monthCount; i++) {
      const start = startOfMonth(new Date(now.getFullYear(), now.getMonth() - i, 1));
      const end = endOfMonth(start);
      const label = format(start, "MMM yyyy");

      const rows = await prisma.$queryRaw<{ day: string; total: any }[]>`
        SELECT strftime('%Y-%m-%d', datetime(timestamp/1000, 'unixepoch')) as day, SUM(amount) as total
        FROM "Transaction"
        WHERE userId = ${payload.userId} AND type = 'expense' AND timestamp >= ${start} AND timestamp <= ${end}
        GROUP BY strftime('%Y-%m-%d', datetime(timestamp/1000, 'unixepoch'))
      `;

      const dailyMap = new Map<string, number>();
      for (const r of rows) dailyMap.set(r.day, toNum(r.total));

      const days = eachDayOfInterval({ start, end });
      const maxAmount = Math.max(...days.map((d) => dailyMap.get(format(d, "yyyy-MM-dd")) ?? 0), 1);

      const data: HeatmapDay[] = days.map((d) => {
        const key = format(d, "yyyy-MM-dd");
        const amount = dailyMap.get(key) ?? 0;
        return {
          date: key,
          dayOfWeek: d.getDay(),
          week: Math.ceil((d.getDate() + start.getDay()) / 7),
          amount,
          intensity: maxAmount > 0 ? amount / maxAmount : 0,
        };
      });

      months.push({ label, data, maxAmount });
    }

    months.reverse();

    return NextResponse.json({ months }, {
      headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=120" },
    });
  } catch (error) {
    console.error("Heatmap error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
