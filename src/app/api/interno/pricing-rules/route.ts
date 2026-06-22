import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { createPricingRule, listPricingRules } from "@/lib/pricing-rule-service";

export async function GET() {
  try {
    const user = await requireInternoModule("cadastros");
    const rules = await listPricingRules(user.tenantId);
    return NextResponse.json({ rules });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireInternoModule("cadastros");
    const body = (await request.json()) as {
      procedureId?: string;
      companyId?: string;
      multiplier?: number;
      description?: string;
    };

    if (!body.procedureId || !body.companyId) {
      return NextResponse.json(
        { error: "Informe procedimento e empresa" },
        { status: 400 },
      );
    }
    if (typeof body.multiplier !== "number" || body.multiplier <= 0) {
      return NextResponse.json({ error: "Multiplicador inválido" }, { status: 400 });
    }

    const result = await createPricingRule({
      tenantId: user.tenantId,
      procedureId: body.procedureId,
      companyId: body.companyId,
      multiplier: body.multiplier,
      description: body.description,
      createdBy: user.id,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}
