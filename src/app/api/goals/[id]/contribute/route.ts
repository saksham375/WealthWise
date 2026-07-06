import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth-server";
import { getCategoryMap } from "@/lib/categories";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const payload = getAuthPayload();
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { amount, note } = await request.json();
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Valid amount is required" }, { status: 400 });
    }

    const goal = await prisma.goal.findFirst({
      where: { id: params.id, userId: payload.userId },
    });
    if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

    const updatedGoal = await prisma.goal.update({
      where: { id: params.id },
      data: { currentSaved: goal.currentSaved + amount },
    });

    await prisma.goalContribution.create({
      data: { goalId: params.id, amount, note: note ?? null },
    });

    // Also create a linked transaction
    const goalCategory = await prisma.category.findFirst({
      where: { name: "Goal Contribution", isSystem: true },
    });

    if (goalCategory) {
      await prisma.transaction.create({
        data: {
          userId: payload.userId,
          categoryId: goalCategory.id,
          amount,
          type: "income",
          description: `Contribution to ${goal.goalName}`,
          timestamp: new Date(),
        },
      });
    }

    // Check milestone
    const percentComplete = (updatedGoal.currentSaved / updatedGoal.targetAmount) * 100;
    if ([25, 50, 75, 100].includes(Math.round(percentComplete))) {
      await prisma.notification.create({
        data: {
          userId: payload.userId,
          type: "GOAL_MILESTONE",
          message: `Goal "${goal.goalName}" has reached ${Math.round(percentComplete)}% of target!`,
        },
      });
    }

    return NextResponse.json(updatedGoal);
  } catch (error) {
    console.error("Contribute error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
