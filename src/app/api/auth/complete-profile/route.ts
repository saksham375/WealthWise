import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { getTokenFromCookie } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    const token = getTokenFromCookie();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    const { age, gender, currencyCode, numberFormat, showCents } =
      await request.json();

    if (!age || !gender) {
      return NextResponse.json(
        { error: "Age and gender are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        age: parseInt(age),
        gender,
        currencyCode: currencyCode ?? "INR",
        numberFormat: numberFormat ?? "indian",
        showCents: showCents ?? true,
      },
    });

    return NextResponse.json({
      userId: user.id,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    console.error("Complete profile error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
