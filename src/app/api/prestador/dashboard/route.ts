import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { getPrestadorDashboard } from "@/lib/prestador-dashboard";

/** KPIs operacionais do prestador logado. */
export async function GET() {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const dashboard = await getPrestadorDashboard(user.tenantId, user.id);
    return NextResponse.json({ dashboard });
  } catch (error) {
    return authErrorResponse(error);
  }
}
