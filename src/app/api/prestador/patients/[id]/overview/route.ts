import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { getProviderPatientOverview } from "@/lib/provider-patient-overview";

/** Histórico clínico do paciente no escopo do prestador logado. */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/prestador/patients/[id]/overview">,
) {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const { id } = await ctx.params;

    const overview = await getProviderPatientOverview(id, user.id, user.tenantId);
    if (!overview) {
      return NextResponse.json(
        { error: "Paciente não encontrado ou sem atendimentos com este prestador" },
        { status: 404 },
      );
    }

    return NextResponse.json({ overview });
  } catch (error) {
    return authErrorResponse(error);
  }
}
