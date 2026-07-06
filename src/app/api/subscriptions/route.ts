import { prisma } from "@/lib/prisma";
import { requireAuth, apiSuccess, apiCreated, apiServerError, apiError, apiNotFound } from "@/lib/api-response";
import { validate, createSubscriptionSchema } from "@/lib/validate";

export async function GET() {
  try {
    const auth = requireAuth();
    if (auth instanceof Response) return auth;

    const subscriptions = await prisma.subscription.findMany({
      where: { userId: auth.userId },
      orderBy: { nextDueDate: "asc" },
    });

    return apiSuccess(subscriptions);
  } catch (error) {
    return apiServerError(error, "Get subscriptions");
  }
}

export async function POST(request: Request) {
  try {
    const auth = requireAuth();
    if (auth instanceof Response) return auth;

    const body = await request.json();
    const parsed = validate(createSubscriptionSchema, body);
    if (!parsed.success) return apiError(parsed.error);

    const subscription = await prisma.subscription.create({
      data: {
        userId: auth.userId,
        serviceName: parsed.data.serviceName,
        emoji: parsed.data.emoji ?? "🔁",
        amount: parsed.data.amount,
        billingCycle: parsed.data.billingCycle,
        nextDueDate: new Date(parsed.data.nextDueDate),
        status: "ACTIVE",
      },
    });

    return apiCreated(subscription);
  } catch (error) {
    return apiServerError(error, "Create subscription");
  }
}
