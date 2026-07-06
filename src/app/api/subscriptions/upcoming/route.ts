import { prisma } from "@/lib/prisma";
import { requireAuth, apiSuccess, apiServerError } from "@/lib/api-response";

export async function GET() {
  try {
    const auth = requireAuth();
    if (auth instanceof Response) return auth;

    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId: auth.userId,
        status: "ACTIVE",
        nextDueDate: { gte: now, lte: thirtyDays },
      },
      orderBy: { nextDueDate: "asc" },
    });

    return apiSuccess(subscriptions);
  } catch (error) {
    return apiServerError(error, "Get upcoming subscriptions");
  }
}
