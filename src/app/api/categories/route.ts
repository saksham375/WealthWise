import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth-server";

export async function GET() {
  try {
    const payload = getAuthPayload();
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { isSystem: true },
          { userId: payload.userId },
        ],
      },
      orderBy: [{ isSystem: "desc" }, { sortOrder: "asc" }],
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Get categories error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = getAuthPayload();
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, type, iconName, color } = body;

    if (!name || !type) {
      return NextResponse.json({ error: "Name and type are required" }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        userId: payload.userId,
        name,
        type,
        iconName: iconName || "MoreHorizontal",
        color: color || "#737373",
        isSystem: false,
        sortOrder: 100,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Create category error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
