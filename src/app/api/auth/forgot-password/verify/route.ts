import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import { addHours } from "date-fns";

export async function POST(request: Request) {
  try {
    const { userId, answers } = await request.json();

    if (!userId || !answers || !Array.isArray(answers) || answers.length < 3) {
      return NextResponse.json(
        { error: "UserId and all 3 answers are required" },
        { status: 400 }
      );
    }

    const securityQuestions = await prisma.securityQuestion.findMany({
      where: { userId },
    });

    if (securityQuestions.length < 3) {
      return NextResponse.json(
        { error: "Security questions not found" },
        { status: 404 }
      );
    }

    for (let i = 0; i < 3; i++) {
      const sq = securityQuestions[i];
      const sanitized = answers[i].toLowerCase().trim();
      const valid = await comparePassword(sanitized, sq.answerHash);

      if (!valid) {
        return NextResponse.json(
          { error: "Incorrect answer" },
          { status: 401 }
        );
      }
    }

    const resetToken = uuidv4();

    await prisma.session.create({
      data: {
        userId,
        token: resetToken,
        expiresAt: addHours(new Date(), 1),
      },
    });

    return NextResponse.json({
      resetToken,
      userId,
    });
  } catch (error) {
    console.error("Forgot password verify error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
