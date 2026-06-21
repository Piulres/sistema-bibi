import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { getPatientOverview } from "@/lib/patient-overview";

/** Visão Cliente 360° consolidada de um beneficiário (Portal Interno). */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/interno/patients/[id]/overview">,
) {
  try {
    const user = await requireUser(["INTERNO"]);
    const { id } = await ctx.params;

    const overview = await getPatientOverview(id, user.tenantId);
    if (!overview) {
      return NextResponse.json({ error: "Beneficiário não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ overview });
  } catch (error) {
    return authErrorResponse(error);
  }
}
