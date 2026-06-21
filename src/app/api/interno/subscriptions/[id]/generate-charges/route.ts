import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { generateSubscriptionCharges } from "@/lib/subscription-service";

export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/interno/subscriptions/[id]/generate-charges">,
) {
  try {
    const user = await requireUser(["INTERNO"]);
    const { id } = await ctx.params;

    const result = await generateSubscriptionCharges({
      tenantId: user.tenantId,
      subscriptionId: id,
      createdBy: user.id,
    });

    if (!result) {
      return NextResponse.json({ error: "Assinatura não encontrada" }, { status: 404 });
    }

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}
