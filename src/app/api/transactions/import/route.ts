import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    const payload = getAuthPayload();
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { transactions, categoryMapping, skipDuplicates = false } = body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json({ error: "No transactions provided" }, { status: 400 });
    }

    const allCategories = await prisma.category.findMany({
      where: {
        OR: [{ isSystem: true }, { userId: payload.userId }],
      },
    });

    const existingTransactions = skipDuplicates
      ? await prisma.transaction.findMany({
          where: { userId: payload.userId },
          select: { amount: true, type: true, description: true, timestamp: true, categoryId: true },
        })
      : [];

    let created = 0;
    let skipped = 0;
    const errors: { row: number; error: string }[] = [];

    for (let i = 0; i < transactions.length; i++) {
      const row = transactions[i];
      const rowNum = i + 1;

      try {
        if (!row.date || row.amount == null || !row.type) {
          errors.push({ row: rowNum, error: "Missing required fields (date, amount, type)" });
          continue;
        }

        const type = String(row.type).toLowerCase();
        if (type !== "income" && type !== "expense") {
          errors.push({ row: rowNum, error: `Invalid type "${row.type}". Must be "income" or "expense"` });
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
            } else {
              const createdCat = await prisma.category.create({
                data: {
                  userId: payload.userId,
                  name: String(row.category),
                  type,
                  iconName: "MoreHorizontal",
                  color: "#737373",
                  isSystem: false,
                  sortOrder: 100,
                },
              });
              allCategories.push(createdCat);
              categoryId = createdCat.id;
            }
          }
        } else {
          const fallback = allCategories.find(
            (c) => c.type === type && c.name.toLowerCase().includes("other")
          );
          categoryId = fallback?.id ?? null;
        }

        if (!categoryId) {
          errors.push({ row: rowNum, error: `No matching category for type "${type}"` });
          continue;
        }

        if (skipDuplicates) {
          const isDuplicate = existingTransactions.some(
            (ex) =>
              ex.amount === amount &&
              ex.type === type &&
              ex.categoryId === categoryId &&
              ex.timestamp.getTime() === timestamp.getTime() &&
              (ex.description ?? "") === (row.description ?? "")
          );

          if (isDuplicate) {
            skipped++;
            continue;
          }
        }

        await prisma.transaction.create({
          data: {
            userId: payload.userId,
            categoryId,
            amount,
            type,
            description: row.description || null,
            timestamp,
            isRecurring: false,
          },
        });

        created++;
      } catch (err) {
        errors.push({ row: rowNum, error: err instanceof Error ? err.message : "Unknown error" });
      }
    }

    return NextResponse.json({ created, skipped, total: transactions.length, errors });
  } catch (error) {
    console.error("Import transactions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
