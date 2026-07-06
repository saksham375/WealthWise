import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, hashPassword } from "@/lib/auth";
import { getTokenFromCookie } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    const token = getTokenFromCookie();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    const { questions } = await request.json();

    if (!questions || !Array.isArray(questions) || questions.length !== 3) {
      return NextResponse.json(
        { error: "Exactly 3 security questions are required" },
        { status: 400 }
      );
    }

    const uniqueQuestions = new Set(questions.map((q: { questionText: string }) => q.questionText));
    if (uniqueQuestions.size !== 3) {
      return NextResponse.json(
        { error: "All 3 security questions must be different" },
        { status: 400 }
      );
    }

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
    console.error("Security questions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
