import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { getClinicFinanceMeta } from "@/lib/clinic-finance/service";

export async function GET() {
  try {
    const user = await requireInternoModule("gestao");
    const meta = await getClinicFinanceMeta(user.tenantId);
    return NextResponse.json(meta);
  } catch (error) {
    return authErrorResponse(error);
  }
}
