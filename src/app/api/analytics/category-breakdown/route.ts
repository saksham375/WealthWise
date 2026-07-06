import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth-server";
import { startOfMonth, subMonths } from "date-fns";

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

    const grouped = await prisma.transaction.groupBy({
      by: ["categoryId"],
      where: {
        userId: payload.userId,
        type: "expense",
        timestamp: { gte: since },
      },
      _sum: { amount: true },
    });

    const categoryIds = grouped.map((g) => g.categoryId);
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true, iconName: true },
    });

    const catMap = new Map(categories.map((c) => [c.id, c]));

    const total = grouped.reduce((s, g) => s + (g._sum.amount ?? 0), 0);

    const breakdown = grouped
      .map((g) => {
        const cat = catMap.get(g.categoryId);
        const amount = g._sum.amount ?? 0;
        return {
          name: cat?.name ?? "Unknown",
          iconName: cat?.iconName ?? "circle",
          amount,
          percentage: total > 0 ? Math.round((amount / total) * 10000) / 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return NextResponse.json({ breakdown, total }, {
      headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=120" },
    });
  } catch (error) {
    console.error("Category breakdown error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
