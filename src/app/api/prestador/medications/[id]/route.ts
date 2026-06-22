import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { updateMedicationStatus } from "@/lib/medication-service";
import { MEDICATION_STATUSES, type MedicationStatus } from "@/lib/clinical/constants";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const prisma = await getPrisma();
  try {
    const user = await requireUser(["PRESTADOR"]);
    const { id } = await params;
    const body = (await request.json()) as { status?: string };

    if (!body.status || !MEDICATION_STATUSES.includes(body.status as MedicationStatus)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }

    const existing = await prisma.medicationPrescription.findFirst({
      where: { id, patient: { tenantId: user.tenantId } },
      include: { patient: { select: { name: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Prescrição não encontrada" }, { status: 404 });
    }

    const medication = await updateMedicationStatus({
      id,
      tenantId: user.tenantId,
      providerId: user.id,
      status: body.status as MedicationStatus,
      patientName: existing.patient.name,
    });

    return NextResponse.json({ medication });
  } catch (error) {
    return authErrorResponse(error);
  }
}
