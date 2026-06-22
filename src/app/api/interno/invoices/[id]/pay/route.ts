import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { markInvoicePaid } from "@/lib/invoice-service";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireInternoModule("billing");
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as { method?: string };

    const result = await markInvoicePaid({
      tenantId: user.tenantId,
      invoiceId: id,
      method: body.method?.trim() || "MANUAL",
      createdBy: user.id,
    });

    if (!result) {
      return NextResponse.json({ error: "Fatura não encontrada" }, { status: 404 });
    }
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}
