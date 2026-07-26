import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireBeneficiary, authErrorResponse } from "@/lib/api-auth";
import {
  confirmInvoicePixPayment,
  createInvoicePixCharge,
} from "@/lib/invoice-service";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const prisma = await getPrisma();
  try {
    const user = await requireBeneficiary();
    const { id } = await params;

    const invoice = await prisma.invoice.findFirst({
      where: { id, tenantId: user.tenantId, patientId: user.patientId },
    });
    if (!invoice) {
      return NextResponse.json({ error: "Fatura não encontrada" }, { status: 404 });
    }

    const result = await createInvoicePixCharge({
      tenantId: user.tenantId,
      invoiceId: id,
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

export async function PATCH(request: Request, { params }: Params) {
  const prisma = await getPrisma();
  try {
    const user = await requireBeneficiary();
    const { id } = await params;
    const body = (await request.json()) as { paymentId?: string };

    if (!body.paymentId) {
      return NextResponse.json({ error: "Informe paymentId" }, { status: 400 });
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id, tenantId: user.tenantId, patientId: user.patientId },
    });
    if (!invoice) {
      return NextResponse.json({ error: "Fatura não encontrada" }, { status: 404 });
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
