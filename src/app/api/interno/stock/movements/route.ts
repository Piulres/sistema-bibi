import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { listStockMovements, registerStockMovement } from "@/lib/stock-service";

export async function GET(request: Request) {
  try {
    const user = await requireInternoModule("estoque");
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? "50");
    const movements = await listStockMovements(user.tenantId, limit);
    return NextResponse.json({ movements });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireInternoModule("estoque");
    const body = (await request.json()) as {
      productId?: string;
      type?: string;
      quantity?: number;
      lotId?: string | null;
      reason?: string | null;
      patientId?: string | null;
      appointmentId?: string | null;
    };

    if (!body.productId || !body.type || !body.quantity) {
      return NextResponse.json(
        { error: "Informe produto, tipo e quantidade" },
        { status: 400 },
      );
    }

    const result = await registerStockMovement({
      tenantId: user.tenantId,
      productId: body.productId,
      type: body.type,
      quantity: body.quantity,
      lotId: body.lotId,
      reason: body.reason,
      patientId: body.patientId,
      appointmentId: body.appointmentId,
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
