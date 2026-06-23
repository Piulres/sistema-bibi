import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { listProcedureKit, setProcedureKitItem } from "@/lib/stock-service";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/interno/stock/procedure-kits/[procedureId]">,
) {
  try {
    const user = await requireInternoModule("estoque");
    const { procedureId } = await ctx.params;
    const items = await listProcedureKit(user.tenantId, procedureId);
    return NextResponse.json({ items });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/interno/stock/procedure-kits/[procedureId]">,
) {
  try {
    const user = await requireInternoModule("estoque");
    const { procedureId } = await ctx.params;
    const body = (await request.json()) as { productId?: string; quantity?: number };

    if (!body.productId || !body.quantity) {
      return NextResponse.json({ error: "Informe produto e quantidade" }, { status: 400 });
    }

    const result = await setProcedureKitItem({
      tenantId: user.tenantId,
      procedureId,
      productId: body.productId,
      quantity: body.quantity,
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
