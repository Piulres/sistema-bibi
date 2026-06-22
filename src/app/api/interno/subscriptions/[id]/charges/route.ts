import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { listSubscriptionCharges } from "@/lib/subscription-service";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/interno/subscriptions/[id]/charges">,
) {
  try {
    const user = await requireInternoModule("subscriptions");
    const { id } = await ctx.params;

    const charges = await listSubscriptionCharges(id, user.tenantId);
    if (!charges) {
      return NextResponse.json({ error: "Assinatura não encontrada" }, { status: 404 });
    }

    return NextResponse.json({ charges });
  } catch (error) {
    return authErrorResponse(error);
  }
}
