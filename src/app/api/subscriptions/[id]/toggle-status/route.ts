import { prisma } from "@/lib/prisma";
import { requireAuth, apiSuccess, apiServerError } from "@/lib/api-response";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = requireAuth();
    if (auth instanceof Response) return auth;

    const sub = await prisma.subscription.findFirst({
      where: { id: params.id, userId: auth.userId },
    });
    if (!sub) return new Response(null, { status: 404 });

    const newStatus = sub.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    const updated = await prisma.subscription.update({
      where: { id: params.id },
      data: { status: newStatus },
    });

    return apiSuccess(updated);
  } catch (error) {
    return apiServerError(error, "Toggle subscription status");
  }
}
