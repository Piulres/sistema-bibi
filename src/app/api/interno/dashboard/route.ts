import { NextResponse } from "next/server";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { getExecutiveDashboard } from "@/lib/executive-dashboard";

/** KPIs consolidados para o Dashboard Executivo (Portal Interno). */
export async function GET() {
  try {
    const user = await requireInternoModule("dashboard");
    const dashboard = await getExecutiveDashboard(user.tenantId);
    return NextResponse.json({ dashboard });
  } catch (error) {
    return authErrorResponse(error);
  }
}
