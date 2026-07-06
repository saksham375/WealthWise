import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    const payload = getAuthPayload();
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { transactions, categoryMapping } = body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json({ error: "No transactions provided" }, { status: 400 });
    }

    const allCategories = await prisma.category.findMany({
      where: {
        OR: [{ isSystem: true }, { userId: payload.userId }],
      },
    });

    const existingTransactions = await prisma.transaction.findMany({
      where: { userId: payload.userId },
      select: { amount: true, type: true, description: true, timestamp: true, categoryId: true },
    });

    const errors: { row: number; error: string }[] = [];
    let duplicates = 0;

    const sampleValid: Record<string, unknown>[] = [];

    for (let i = 0; i < transactions.length; i++) {
      const row = transactions[i];
      const rowNum = i + 1;

      if (!row.date || row.amount == null || !row.type) {
        errors.push({ row: rowNum, error: "Missing required fields (date, amount, type)" });
        continue;
      }

      const type = String(row.type).toLowerCase();
      if (type !== "income" && type !== "expense") {
        errors.push({ row: rowNum, error: `Invalid type "${row.type}"` });
        continue;
      }

      const amount = parseFloat(row.amount);
      if (isNaN(amount) || amount <= 0) {
        errors.push({ row: rowNum, error: `Invalid amount "${row.amount}"` });
        continue;
      }

      const timestamp = new Date(row.date);
      if (isNaN(timestamp.getTime())) {
        errors.push({ row: rowNum, error: `Invalid date "${row.date}"` });
        continue;
      }

      let categoryId: string | null = null;
      if (row.category) {
        const mappedId = categoryMapping?.[row.category];
        if (mappedId) {
          categoryId = mappedId;
        } else {
          const match = allCategories.find(
            (c) => c.name.toLowerCase() === String(row.category).toLowerCase()
          );
          if (match) {
            categoryId = match.id;
          }
        }
      }

      if (!categoryId) {
        const fallback = allCategories.find(
          (c) => c.type === type && c.name.toLowerCase().includes("other")
        );
        categoryId = fallback?.id ?? null;
      }

      if (!categoryId) {
        errors.push({ row: rowNum, error: "No matching category" });
        continue;
      }

      const isDuplicate = existingTransactions.some(
        (ex) =>
          ex.amount === amount &&
          ex.type === type &&
          ex.categoryId === categoryId &&
          ex.timestamp.getTime() === timestamp.getTime() &&
          (ex.description ?? "") === (row.description ?? "")
      );

      if (isDuplicate) {
        duplicates++;
        continue;
      }

      if (sampleValid.length < 10) {
        sampleValid.push({
          date: row.date,
          amount,
          type,
          category: row.category || "",
          description: row.description || "",
        });
      }
    }

    return NextResponse.json({
      valid: transactions.length - errors.length - duplicates,
      errors,
      duplicates,
      total: transactions.length,
      sampleValid,
    });
  } catch (error) {
    console.error("Preview import error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
