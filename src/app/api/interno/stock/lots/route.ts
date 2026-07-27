import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { getPrisma } from "@/lib/db";
import { listStockLots, receiveStockEntry } from "@/lib/stock-service";

export async function GET(request: Request) {
  try {
    const user = await requireInternoModule("estoque");
    const url = new URL(request.url);
    const productId = url.searchParams.get("productId") ?? undefined;
    const status = url.searchParams.get("status") ?? undefined;
    const lots = await listStockLots(user.tenantId, { productId, status: status ?? undefined });
    return NextResponse.json({ lots });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireInternoModule("estoque");
    const body = (await request.json()) as {
      productId?: string;
      lotNumber?: string;
      expiryDate?: string;
      quantity?: number;
      unitCost?: number;
      supplierRef?: string | null;
    };

    if (!body.productId || !body.quantity) {
      return NextResponse.json({ error: "Informe produto e quantidade" }, { status: 400 });
    }

    const prisma = await getPrisma();
    const product = await prisma.medicalProduct.findFirst({
      where: { id: body.productId, tenantId: user.tenantId },
      select: { requiresLot: true },
    });
    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    if (product.requiresLot && (!body.lotNumber?.trim() || !body.expiryDate)) {
      return NextResponse.json(
        { error: "Informe produto, lote, validade e quantidade" },
        { status: 400 },
      );
    }

    let expiryDate: Date | null = null;
    if (body.expiryDate) {
      expiryDate = new Date(body.expiryDate);
      if (Number.isNaN(expiryDate.getTime())) {
        return NextResponse.json({ error: "Data de validade inválida" }, { status: 400 });
      }
    }

    const result = await receiveStockEntry({
      tenantId: user.tenantId,
      productId: body.productId,
      lotNumber: body.lotNumber,
      expiryDate,
      quantity: body.quantity,
      unitCost: body.unitCost,
      supplierRef: body.supplierRef,
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
