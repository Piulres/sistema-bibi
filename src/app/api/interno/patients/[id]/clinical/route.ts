import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireInternoModule, authErrorResponse } from "@/lib/api-auth";
import { getPatientClinicalOverview } from "@/lib/clinical-overview";
import { listPatientMedications } from "@/lib/medication-service";
import { listPatientExamOrders } from "@/lib/exam-order-service";
import { listPatientProtocolEnrollments } from "@/lib/care-protocol-service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await requireInternoModule("cadastros");
    const { id: patientId } = await params;

    const prisma = await getPrisma();
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, tenantId: user.tenantId },
      select: { id: true },
    });
    if (!patient) {
      return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
    }

    const [overview, medications, examOrders, protocols] = await Promise.all([
      getPatientClinicalOverview(patientId, user.tenantId),
      listPatientMedications(patientId, user.tenantId),
      listPatientExamOrders(patientId, user.tenantId),
      listPatientProtocolEnrollments(patientId, user.tenantId),
    ]);

    return NextResponse.json({
      clinical: { overview, medications, examOrders, protocols },
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
