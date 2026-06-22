import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { deletePricingRule, updatePricingRule } from "@/lib/pricing-rule-service";

export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/interno/pricing-rules/[id]">,
) {
  try {
    const user = await requireInternoModule("cadastros");
    const { id } = await ctx.params;
    const body = (await request.json()) as {
      multiplier?: number;
      description?: string;
    };

    const result = await updatePricingRule({
      tenantId: user.tenantId,
      ruleId: id,
      multiplier: body.multiplier,
      description: body.description,
      createdBy: user.id,
    });

    if (!result) {
      return NextResponse.json({ error: "Regra não encontrada" }, { status: 404 });
    }
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/interno/pricing-rules/[id]">,
) {
  try {
    const user = await requireInternoModule("cadastros");
    const { id } = await ctx.params;

    const result = await deletePricingRule({
      tenantId: user.tenantId,
      ruleId: id,
      createdBy: user.id,
    });

    if (!result) {
      return NextResponse.json({ error: "Regra não encontrada" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}
