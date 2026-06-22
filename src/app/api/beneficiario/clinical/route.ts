import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/api-auth";
import { getPatientClinicalOverview } from "@/lib/clinical-overview";
import { listPatientMedications } from "@/lib/medication-service";
import { listPatientExamOrders } from "@/lib/exam-order-service";
import { listPatientProtocolEnrollments } from "@/lib/care-protocol-service";

export async function GET() {
  try {
    const user = await requireUser(["BENEFICIARIO"]);
    if (!user.patientId) {
      return NextResponse.json({ error: "Beneficiário sem vínculo" }, { status: 403 });
    }

    const [overview, medications, examOrders, protocols] = await Promise.all([
      getPatientClinicalOverview(user.patientId, user.tenantId),
      listPatientMedications(user.patientId, user.tenantId),
      listPatientExamOrders(user.patientId, user.tenantId),
      listPatientProtocolEnrollments(user.patientId, user.tenantId),
    ]);

    return NextResponse.json({
      clinical: {
        profile: overview?.profile ?? null,
        activeMedications: medications.filter((m) => m.status === "ATIVA"),
        medications,
        examOrders,
        protocols,
      },
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
