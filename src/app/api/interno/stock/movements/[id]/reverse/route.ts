import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { reverseStockMovement } from "@/lib/change-management/stock-reverse";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireInternoModule("estoque");
    const { id } = await params;
    const body = (await request.json()) as { reason?: string };

    const result = await reverseStockMovement({
      tenantId: user.tenantId,
      movementId: id,
      createdBy: user.id,
      reason: body.reason,
    });

    if (!result) {
      return NextResponse.json({ error: "Movimentação não encontrada" }, { status: 404 });
    }
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}
