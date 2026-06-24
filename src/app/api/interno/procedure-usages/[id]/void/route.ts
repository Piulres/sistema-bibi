import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { voidProcedureUsage } from "@/lib/change-management/procedure-usage-void";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const user = await requireInternoModule("billing");
    const { id } = await params;

    const result = await voidProcedureUsage({
      tenantId: user.tenantId,
      usageId: id,
      createdBy: user.id,
    });

    if (!result) {
      return NextResponse.json({ error: "Uso não encontrado ou já faturado" }, { status: 404 });
    }
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}
