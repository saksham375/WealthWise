import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth-server";

export async function GET() {
  try {
    const payload = getAuthPayload();
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const goals = await prisma.goal.findMany({
      where: { userId: payload.userId },
      include: { contributions: { orderBy: { createdAt: "desc" }, take: 3 } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(goals);
  } catch (error) {
    console.error("Get goals error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = getAuthPayload();
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { goalName, emoji, targetAmount, currentSaved, deadline } = await request.json();
    if (!goalName || !targetAmount || !deadline) {
      return NextResponse.json({ error: "Name, target, and deadline are required" }, { status: 400 });
    }

    const goal = await prisma.goal.create({
      data: {
        userId: payload.userId,
        goalName,
        emoji: emoji ?? "🎯",
        targetAmount,
        currentSaved: currentSaved ?? 0,
        deadline: new Date(deadline),
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error("Create goal error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
