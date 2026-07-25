import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { getClinicFinanceKpis } from "@/lib/clinic-finance/service";

export async function GET(request: Request) {
  try {
    const user = await requireInternoModule("gestao");
    const { searchParams } = new URL(request.url);
    const year = Number(searchParams.get("year") || undefined);
    const month = Number(searchParams.get("month") || undefined);
    const kpis = await getClinicFinanceKpis(
      user.tenantId,
      Number.isFinite(year) ? year : undefined,
      Number.isFinite(month) ? month : undefined,
    );
    return NextResponse.json({ kpis });
  } catch (error) {
    return authErrorResponse(error);
  }
}
