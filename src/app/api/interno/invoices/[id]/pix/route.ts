import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { createInvoicePixCharge } from "@/lib/invoice-service";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const user = await requireUser(["INTERNO"]);
    const { id } = await params;

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
