import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { getStockAlerts } from "@/lib/stock-service";

export async function GET() {
  try {
    const user = await requireInternoModule("estoque");
    const alerts = await getStockAlerts(user.tenantId);
    return NextResponse.json({ alerts });
  } catch (error) {
    return authErrorResponse(error);
  }
}
