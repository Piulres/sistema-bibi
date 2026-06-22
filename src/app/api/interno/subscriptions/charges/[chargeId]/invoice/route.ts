import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { invoiceSubscriptionCharge } from "@/lib/invoice-service";

type Params = { params: Promise<{ chargeId: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const user = await requireInternoModule("subscriptions");
    const { chargeId } = await params;

    const result = await invoiceSubscriptionCharge({
      tenantId: user.tenantId,
      chargeId,
      createdBy: user.id,
    });

    if (!result) {
      return NextResponse.json({ error: "Cobrança não encontrada ou já faturada" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}
