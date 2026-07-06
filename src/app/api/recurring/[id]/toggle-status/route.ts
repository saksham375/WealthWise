import { prisma } from "@/lib/prisma";
import { requireAuth, apiSuccess, apiServerError } from "@/lib/api-response";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = requireAuth();
    if (auth instanceof Response) return auth;

    const schedule = await prisma.recurringSchedule.findFirst({
      where: { id: params.id, userId: auth.userId },
    });
    if (!schedule) return new Response(null, { status: 404 });

    const updated = await prisma.recurringSchedule.update({
      where: { id: params.id },
      data: { isActive: !schedule.isActive },
    });

    return apiSuccess(updated);
  } catch (error) {
    return apiServerError(error, "Toggle recurring schedule status");
  }
}
