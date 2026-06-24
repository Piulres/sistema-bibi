import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { isInternoAdmin } from "@/lib/interno-permissions";
import { voidInvoice } from "@/lib/change-management/invoice-void";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireInternoModule("billing");
    if (!isInternoAdmin(user.role, user.internoProfile)) {
      return NextResponse.json({ error: "Somente administrador pode anular fatura" }, { status: 403 });
    }

    const { id } = await params;
    const body = (await request.json()) as { reason?: string };

    const result = await voidInvoice({
      tenantId: user.tenantId,
      invoiceId: id,
      createdBy: user.id,
      reason: body.reason,
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
