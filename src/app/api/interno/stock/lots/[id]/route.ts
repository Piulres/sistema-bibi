import { NextResponse } from "next/server";
import { authErrorResponse, requireInternoModuleWrite } from "@/lib/api-auth";
import { updateLotStatus } from "@/lib/stock-service";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/interno/stock/lots/[id]">,
) {
  try {
    const user = await requireInternoModuleWrite("estoque");
    const { id } = await ctx.params;
    const body = (await request.json()) as { status?: string };

    if (!body.status) {
      return NextResponse.json({ error: "Informe o status" }, { status: 400 });
    }

    const result = await updateLotStatus({
      tenantId: user.tenantId,
      lotId: id,
      status: body.status,
      updatedBy: user.id,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}
