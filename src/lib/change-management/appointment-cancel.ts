import "server-only";
import { getPrisma } from "@/lib/db";
import { buildChangeMetadata } from "@/lib/change-management/metadata";
import { newCorrelationId } from "@/lib/change-management/run-change";
import { createAppointment } from "@/lib/appointment-service";
import { createPatient } from "@/lib/patient-service";
import { createPet } from "@/lib/pet-service";
import { requiresPet } from "@/lib/vet-niche";
import { recordTimelineEvent, TIMELINE_ACTIONS, TIMELINE_ENTITY_TYPES } from "@/lib/timeline";

/** Walk-in atômico: beneficiário + agendamento com correlationId compartilhado. */
export async function walkInAndSchedule(input: {
  tenantId: string;
  name: string;
  cpf: string;
  birthDate: Date;
  phone?: string | null;
  providerId: string;
  scheduledAt: Date;
  reason?: string | null;
  createdBy: string;
  petName?: string | null;
  petSpecies?: string | null;
}) {
  const correlationId = newCorrelationId();
  const prisma = await getPrisma();
  const tenant = await prisma.tenant.findFirst({
    where: { id: input.tenantId },
    select: { niche: true },
  });
  const isVet = requiresPet(tenant?.niche);

  const patientResult = await createPatient({
    tenantId: input.tenantId,
    name: input.name,
    cpf: input.cpf,
    birthDate: input.birthDate,
    phone: input.phone,
    companyId: null,
    createdBy: input.createdBy,
    correlationId,
  });
  if ("error" in patientResult) return patientResult;

  let petId: string | null = null;
  if (isVet) {
    if (!input.petName?.trim() || !input.petSpecies) {
      return { error: "Informe nome e espécie do pet para walk-in veterinário" as const };
    }
    const petResult = await createPet({
      tenantId: input.tenantId,
      patientId: patientResult.patient.id,
      name: input.petName.trim(),
      species: input.petSpecies,
      createdBy: input.createdBy,
    });
    if ("error" in petResult) return petResult;
    petId = petResult.pet.id;
  }

  const apptResult = await createAppointment({
    tenantId: input.tenantId,
    patientId: patientResult.patient.id,
    petId,
    providerId: input.providerId,
    scheduledAt: input.scheduledAt,
    reason: input.reason,
    status: "AGENDADO",
    modality: "PRESENCIAL",
    createdBy: input.createdBy,
    correlationId,
  });
  if ("error" in apptResult) return apptResult;

  return { patient: patientResult.patient, appointment: apptResult.appointment, correlationId };
}

/** Cancelamento interno com ação CANCELLED na timeline. */
export async function cancelInternoAppointment(input: {
  tenantId: string;
  appointmentId: string;
  createdBy: string;
  reason?: string;
}) {
  const prisma = await getPrisma();
  const appointment = await prisma.appointment.findFirst({
    where: { id: input.appointmentId, tenantId: input.tenantId },
    include: { patient: { select: { name: true } } },
  });
  if (!appointment) return null;

  if (["REALIZADO", "CANCELADO", "FALTOU"].includes(appointment.status)) {
    return { error: `Não é possível cancelar agendamento com status ${appointment.status}` as const };
  }

  const before = { status: appointment.status, reason: appointment.reason };
  await prisma.appointment.update({
    where: { id: appointment.id },
    data: { status: "CANCELADO", reason: input.reason ?? appointment.reason },
  });

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.APPOINTMENT,
    entityId: appointment.id,
    action: TIMELINE_ACTIONS.CANCELLED,
    description: `Agendamento cancelado (interno): ${appointment.patient.name}`,
    createdBy: input.createdBy,
    metadata: buildChangeMetadata(before, { status: "CANCELADO", reason: input.reason ?? appointment.reason }),
    reversible: true,
  });

  return { ok: true as const, status: "CANCELADO" as const };
}
