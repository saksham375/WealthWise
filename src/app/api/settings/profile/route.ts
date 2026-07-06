import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth-server";

export async function PUT(request: Request) {
  try {
    const payload = getAuthPayload();
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, age, gender, currencyCode, numberFormat, showCents } = await request.json();

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (age !== undefined) data.age = parseInt(age);
    if (gender !== undefined) data.gender = gender;
    if (currencyCode !== undefined) data.currencyCode = currencyCode;
    if (numberFormat !== undefined) data.numberFormat = numberFormat;
    if (showCents !== undefined) data.showCents = showCents;

    const user = await prisma.user.update({
      where: { id: payload.userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        age: true,
        gender: true,
        avatarPath: true,
        currencyCode: true,
        showCents: true,
        numberFormat: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
