import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        securityQuestions: true,
      },
    });

    if (!user || user.securityQuestions.length < 3) {
      return NextResponse.json(
        { error: "User not found or no security questions set" },
        { status: 404 }
      );
    }

    const questions = user.securityQuestions.map((q) => ({
      id: q.id,
      questionText: q.questionText,
    }));

    return NextResponse.json({
      userId: user.id,
      questions,
    });
  } catch (error) {
    console.error("Forgot password init error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
