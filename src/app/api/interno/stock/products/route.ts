import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import {
  createMedicalProduct,
  getStockOverview,
  listMedicalProducts,
  refreshExpiredLots,
} from "@/lib/stock-service";

export async function GET() {
  try {
    const user = await requireInternoModule("estoque");
    await refreshExpiredLots(user.tenantId);
    const [products, overview] = await Promise.all([
      listMedicalProducts(user.tenantId),
      getStockOverview(user.tenantId),
    ]);
    return NextResponse.json({ products, overview });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireInternoModule("estoque");
    const body = (await request.json()) as {
      sku?: string;
      name?: string;
      category?: string;
      unit?: string;
      minStock?: number;
      anvisaCode?: string | null;
      requiresLot?: boolean;
    };

    if (!body.sku?.trim() || !body.name?.trim() || !body.category) {
      return NextResponse.json({ error: "Informe SKU, nome e categoria" }, { status: 400 });
    }

    const result = await createMedicalProduct({
      tenantId: user.tenantId,
      sku: body.sku,
      name: body.name,
      category: body.category,
      unit: body.unit,
      minStock: body.minStock,
      anvisaCode: body.anvisaCode,
      requiresLot: body.requiresLot,
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
