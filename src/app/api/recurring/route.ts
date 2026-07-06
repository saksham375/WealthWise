import { prisma } from "@/lib/prisma";
import { requireAuth, apiSuccess, apiCreated, apiServerError, apiError } from "@/lib/api-response";
import { validate, createRecurringSchema } from "@/lib/validate";

export async function GET() {
  try {
    const auth = requireAuth();
    if (auth instanceof Response) return auth;

    const schedules = await prisma.recurringSchedule.findMany({
      where: { userId: auth.userId },
      orderBy: { nextRunDate: "asc" },
      include: {
        category: { select: { name: true, iconName: true, color: true } },
      },
    });

    const schedulesWithStats = await Promise.all(
      schedules.map(async (s) => {
        const txCount = await prisma.transaction.count({
          where: { recurringId: s.id },
        });
        const lastTx = await prisma.transaction.findFirst({
          where: { recurringId: s.id },
          orderBy: { timestamp: "desc" },
          select: { timestamp: true, amount: true },
        });
        return {
          ...s,
          transactionCount: txCount,
          lastRunDate: lastTx?.timestamp ?? null,
          lastRunAmount: lastTx?.amount ?? null,
        };
      })
    );

    return apiSuccess(schedulesWithStats);
  } catch (error) {
    return apiServerError(error, "Get recurring schedules");
  }
}

export async function POST(request: Request) {
  try {
    const auth = requireAuth();
    if (auth instanceof Response) return auth;

    const body = await request.json();
    const parsed = validate(createRecurringSchema, body);
    if (!parsed.success) return apiError(parsed.error);

    const schedule = await prisma.recurringSchedule.create({
      data: {
        userId: auth.userId,
        templateTitle: parsed.data.templateTitle,
        amount: parsed.data.amount,
        type: parsed.data.type,
        categoryId: parsed.data.categoryId,
        frequency: parsed.data.frequency,
        nextRunDate: new Date(parsed.data.nextRunDate),
        isActive: true,
      },
    });

    return apiCreated(schedule);
  } catch (error) {
    return apiServerError(error, "Create recurring schedule");
  }
}
