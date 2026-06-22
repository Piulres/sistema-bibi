import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { confirmInvoicePixPayment } from "@/lib/invoice-service";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireInternoModule("billing");
    const { id } = await params;
    const body = (await request.json()) as { paymentId?: string };

    if (!body.paymentId) {
      return NextResponse.json({ error: "Informe paymentId" }, { status: 400 });
    }

    const result = await confirmInvoicePixPayment({
      tenantId: user.tenantId,
      invoiceId: id,
      paymentId: body.paymentId,
      createdBy: user.id,
    });

    if (!result) {
      return NextResponse.json({ error: "Pagamento PIX não encontrado" }, { status: 404 });
    }
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}
