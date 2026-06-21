import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { updateSubscriptionStatus } from "@/lib/subscription-service";
import { isSubscriptionStatus } from "@/lib/subscription";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/interno/subscriptions/[id]">,
) {
  try {
    const user = await requireUser(["INTERNO"]);
    const { id } = await ctx.params;
    const body = (await request.json()) as { status?: string };

    if (!body.status || !isSubscriptionStatus(body.status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }

    const subscription = await updateSubscriptionStatus({
      tenantId: user.tenantId,
      subscriptionId: id,
      status: body.status,
      createdBy: user.id,
    });

    if (!subscription) {
      return NextResponse.json({ error: "Assinatura não encontrada" }, { status: 404 });
    }

    return NextResponse.json({ subscription });
  } catch (error) {
    return authErrorResponse(error);
  }
}
