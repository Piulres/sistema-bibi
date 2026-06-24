import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { getPatientClinicalOverview } from "@/lib/clinical-overview";
import { getPetClinicalOverview } from "@/lib/pet-clinical-overview";
import { getPrisma } from "@/lib/db";
import { requiresPet } from "@/lib/vet-niche";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireUser(["PRESTADOR"]);
    const { id } = await params;
    const prisma = await getPrisma();
    const tenant = await prisma.tenant.findFirst({
      where: { id: user.tenantId },
      select: { niche: true },
    });

    if (requiresPet(tenant?.niche)) {
      const petOverview = await getPetClinicalOverview(id, user.tenantId);
      if (petOverview) {
        return NextResponse.json({
          overview: {
            subjectType: "pet",
            petId: petOverview.petId,
            profile: petOverview.profile,
            activeMedications: petOverview.activeMedications,
            pendingExams: petOverview.pendingExams,
            activeProtocols: [],
            vaccines: petOverview.vaccines,
            upcomingVaccines: petOverview.upcomingVaccines,
          },
        });
      }
    }

    const overview = await getPatientClinicalOverview(id, user.tenantId);
    if (!overview) {
      return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ overview: { subjectType: "patient", ...overview } });
  } catch (error) {
    return authErrorResponse(error);
  }
}
