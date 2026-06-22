import "server-only";
import { getClinicalProfile } from "@/lib/clinical-profile-service";
import { listPatientMedications } from "@/lib/medication-service";
import { listPatientExamOrders } from "@/lib/exam-order-service";
import { listPatientProtocolEnrollments } from "@/lib/care-protocol-service";
import type { ClinicalProfileView } from "@/lib/clinical-profile-service";
import type { MedicationView } from "@/lib/medication-service";
import type { ExamOrderView } from "@/lib/exam-order-service";
import type { ProtocolEnrollmentView } from "@/lib/care-protocol-service";

export type PatientClinicalOverview = {
  profile: ClinicalProfileView;
  activeMedications: MedicationView[];
  pendingExams: ExamOrderView[];
  activeProtocols: ProtocolEnrollmentView[];
};

/** Visão clínica consolidada para sidebar e portais. */
export async function getPatientClinicalOverview(
  patientId: string,
  tenantId: string,
): Promise<PatientClinicalOverview | null> {
  const profile = await getClinicalProfile(patientId, tenantId);
  if (!profile) return null;

  const [activeMedications, examOrders, protocolEnrollments] = await Promise.all([
    listPatientMedications(patientId, tenantId, { activeOnly: true }),
    listPatientExamOrders(patientId, tenantId),
    listPatientProtocolEnrollments(patientId, tenantId, { status: "ATIVO" }),
  ]);

  const pendingExams = examOrders.filter((e) =>
    ["SOLICITADO", "AGENDADO", "REALIZADO"].includes(e.status),
  );

  return {
    profile,
    activeMedications,
    pendingExams,
    activeProtocols: protocolEnrollments,
  };
}
