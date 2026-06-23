import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { updateMedicalProduct } from "@/lib/stock-service";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/interno/stock/products/[id]">,
) {
  try {
    const user = await requireInternoModule("estoque");
    const { id } = await ctx.params;
    const body = (await request.json()) as {
      name?: string;
      minStock?: number;
      anvisaCode?: string | null;
      active?: boolean;
    };

    const result = await updateMedicalProduct({
      tenantId: user.tenantId,
      productId: id,
      name: body.name,
      minStock: body.minStock,
      anvisaCode: body.anvisaCode,
      active: body.active,
      updatedBy: user.id,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return authErrorResponse(error);
  }
}
