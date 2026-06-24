import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { getPatientClinicalOverview } from "@/lib/clinical-overview";
import { getPetClinicalOverview } from "@/lib/pet-clinical-overview";
import { listPatientMedications } from "@/lib/medication-service";
import { listPatientExamOrders } from "@/lib/exam-order-service";
import { listPatientProtocolEnrollments } from "@/lib/care-protocol-service";
import { listPets } from "@/lib/pet-service";
import { getPrisma } from "@/lib/db";
import { requiresPet } from "@/lib/vet-niche";

export async function GET() {
  try {
    const user = await requireUser(["BENEFICIARIO"]);
    if (!user.patientId) {
      return NextResponse.json({ error: "Beneficiário sem vínculo" }, { status: 403 });
    }

    const prisma = await getPrisma();
    const tenant = await prisma.tenant.findFirst({
      where: { id: user.tenantId },
      select: { niche: true },
    });

    const [overview, medications, examOrders, protocols] = await Promise.all([
      getPatientClinicalOverview(user.patientId, user.tenantId),
      listPatientMedications(user.patientId, user.tenantId),
      listPatientExamOrders(user.patientId, user.tenantId),
      listPatientProtocolEnrollments(user.patientId, user.tenantId),
    ]);

    let petsClinical: Awaited<ReturnType<typeof getPetClinicalOverview>>[] = [];
    if (requiresPet(tenant?.niche)) {
      const pets = await listPets(user.tenantId, { patientId: user.patientId });
      const overviews = await Promise.all(
        pets.map((p) => getPetClinicalOverview(p.id, user.tenantId)),
      );
      petsClinical = overviews.filter((o): o is NonNullable<typeof o> => o !== null);
    }

    return NextResponse.json({
      clinical: {
        profile: overview?.profile ?? null,
        activeMedications: medications.filter((m) => m.status === "ATIVA"),
        medications,
        examOrders,
        protocols,
        petsClinical,
      },
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
