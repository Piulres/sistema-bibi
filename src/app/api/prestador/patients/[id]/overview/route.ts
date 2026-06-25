import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import {
  getProviderPatientOverview,
  getProviderPetOverview,
} from "@/lib/provider-patient-overview";
import { getPrisma } from "@/lib/db";
import { requiresPet } from "@/lib/vet-niche";

/** Histórico clínico do paciente ou pet no escopo do prestador logado. */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/prestador/patients/[id]/overview">,
) {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const { id } = await ctx.params;
    const prisma = await getPrisma();
    const tenant = await prisma.tenant.findFirst({
      where: { id: user.tenantId },
      select: { niche: true },
    });

    let overview = null;
    if (requiresPet(tenant?.niche)) {
      overview = await getProviderPetOverview(id, user.id, user.tenantId);
    }
    if (!overview) {
      overview = await getProviderPatientOverview(id, user.id, user.tenantId);
    }
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
