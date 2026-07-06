import { prisma } from "@/lib/prisma";
import { requireAuth, apiSuccess, apiServerError, apiError, apiNotFound } from "@/lib/api-response";
import { validate, updateRecurringSchema } from "@/lib/validate";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = requireAuth();
    if (auth instanceof Response) return auth;

    const schedule = await prisma.recurringSchedule.findFirst({
      where: { id: params.id, userId: auth.userId },
    });
    if (!schedule) return apiNotFound("Recurring schedule");

    const body = await request.json();
    const parsed = validate(updateRecurringSchema, body);
    if (!parsed.success) return apiError(parsed.error);

    const updated = await prisma.recurringSchedule.update({
      where: { id: params.id },
      data: parsed.data,
    });

    return apiSuccess(updated);
  } catch (error) {
    return apiServerError(error, "Update recurring schedule");
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = requireAuth();
    if (auth instanceof Response) return auth;

    const schedule = await prisma.recurringSchedule.findFirst({
      where: { id: params.id, userId: auth.userId },
    });
    if (!schedule) return apiNotFound("Recurring schedule");

    await prisma.recurringSchedule.delete({ where: { id: params.id } });
    return apiSuccess({ success: true });
  } catch (error) {
    return apiServerError(error, "Delete recurring schedule");
  }
}
