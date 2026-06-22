import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { updateSubscription, updateSubscriptionStatus } from "@/lib/subscription-service";
import { isBillingCycle, isSubscriptionStatus } from "@/lib/subscription";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/interno/subscriptions/[id]">,
) {
  try {
    const user = await requireInternoModule("subscriptions");
    const { id } = await ctx.params;
    const body = (await request.json()) as {
      status?: string;
      amount?: number;
      billingCycle?: string;
      description?: string | null;
    };

    const hasAmount = body.amount !== undefined;
    const hasStatus = body.status !== undefined;
    const hasCycle = body.billingCycle !== undefined;
    const hasDescription = body.description !== undefined;

    if (!hasAmount && !hasStatus && !hasCycle && !hasDescription) {
      return NextResponse.json(
        { error: "Informe status, amount, billingCycle ou description" },
        { status: 400 },
      );
    }

    if (hasStatus) {
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
      if (!hasAmount && !hasCycle && !hasDescription) {
        return NextResponse.json({ subscription });
      }
    }

    if (hasAmount || hasCycle || hasDescription) {
      if (hasCycle && body.billingCycle && !isBillingCycle(body.billingCycle)) {
        return NextResponse.json({ error: "Ciclo inválido" }, { status: 400 });
      }
      const result = await updateSubscription({
        tenantId: user.tenantId,
        subscriptionId: id,
        amount: body.amount,
        billingCycle: body.billingCycle,
        description: body.description,
        createdBy: user.id,
      });
      if (!result) {
        return NextResponse.json({ error: "Assinatura não encontrada" }, { status: 404 });
      }
      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Nada a atualizar" }, { status: 400 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
