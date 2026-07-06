import { prisma } from "@/lib/prisma";
import { requireAuth, apiSuccess, apiServerError, apiError, apiNotFound } from "@/lib/api-response";
import { validate, updateSubscriptionSchema } from "@/lib/validate";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = requireAuth();
    if (auth instanceof Response) return auth;

    const sub = await prisma.subscription.findFirst({
      where: { id: params.id, userId: auth.userId },
    });
    if (!sub) return apiNotFound("Subscription");

    const body = await request.json();
    const parsed = validate(updateSubscriptionSchema, body);
    if (!parsed.success) return apiError(parsed.error);

    const updated = await prisma.subscription.update({
      where: { id: params.id },
      data: parsed.data,
    });

    return apiSuccess(updated);
  } catch (error) {
    return apiServerError(error, "Update subscription");
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = requireAuth();
    if (auth instanceof Response) return auth;

    const sub = await prisma.subscription.findFirst({
      where: { id: params.id, userId: auth.userId },
    });
    if (!sub) return apiNotFound("Subscription");

    await prisma.subscription.delete({ where: { id: params.id } });
    return apiSuccess({ success: true });
  } catch (error) {
    return apiServerError(error, "Delete subscription");
  }
}
