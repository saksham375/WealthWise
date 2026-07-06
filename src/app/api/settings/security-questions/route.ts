import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth-server";
import { hashPassword } from "@/lib/auth";

export async function GET() {
  try {
    const payload = getAuthPayload();
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const questions = await prisma.securityQuestion.findMany({
      where: { userId: payload.userId },
      select: { id: true, questionText: true },
    });

    return NextResponse.json(questions);
  } catch (error) {
    console.error("Get security questions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const payload = getAuthPayload();
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { questions } = await request.json();
    if (!questions || !Array.isArray(questions) || questions.length !== 3) {
      return NextResponse.json({ error: "Exactly 3 security questions are required" }, { status: 400 });
    }

    const uniqueQuestions = new Set(questions.map((q: { questionText: string }) => q.questionText));
    if (uniqueQuestions.size !== 3) {
      return NextResponse.json({ error: "All 3 security questions must be different" }, { status: 400 });
    }

    await prisma.securityQuestion.deleteMany({ where: { userId: payload.userId } });

    for (const q of questions) {
      const answerHash = await hashPassword(q.answer.toLowerCase().trim());
      await prisma.securityQuestion.create({
        data: {
          userId: payload.userId,
          questionText: q.questionText,
          answerHash,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update security questions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
