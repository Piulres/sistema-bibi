import "server-only";
import { getPrisma } from "@/lib/db";
import { bookBeneficiaryAppointment } from "@/lib/scheduling-service";

/**
 * Garante que o paciente pertence à empresa do RH (anti-IDOR B2B).
 * Particular (companyId null) e outras empresas são rejeitados.
 */
export async function assertCompanyPatient(input: {
  tenantId: string;
  companyId: string;
  patientId: string;
}) {
  const prisma = await getPrisma();
  const patient = await prisma.patient.findFirst({
    where: {
      id: input.patientId,
      tenantId: input.tenantId,
      companyId: input.companyId,
    },
    select: { id: true, name: true, companyId: true },
  });

  if (!patient) {
    return { error: "Beneficiário não encontrado na empresa" as const };
  }

  return { patient };
}

/** RH agenda em nome de colaborador da própria empresa — reusa engine self-service. */
export async function bookPjAppointment(input: {
  tenantId: string;
  companyId: string;
  patientId: string;
  petId?: string | null;
  providerId?: string;
  procedureId?: string;
  scheduledAt: Date;
  reason?: string | null;
  modality?: string;
  autoAssignProvider?: boolean;
  createdBy: string;
}) {
  const ownership = await assertCompanyPatient({
    tenantId: input.tenantId,
    companyId: input.companyId,
    patientId: input.patientId,
  });
  if ("error" in ownership) return ownership;

  return bookBeneficiaryAppointment({
    tenantId: input.tenantId,
    patientId: ownership.patient.id,
    petId: input.petId,
    providerId: input.providerId,
    procedureId: input.procedureId,
    scheduledAt: input.scheduledAt,
    reason: input.reason,
    modality: input.modality,
    autoAssignProvider: input.autoAssignProvider,
    createdBy: input.createdBy,
  });
}
