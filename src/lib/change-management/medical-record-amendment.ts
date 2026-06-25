import "server-only";
import { getPrisma } from "@/lib/db";
import { recordTimelineEvent, TIMELINE_ACTIONS, TIMELINE_ENTITY_TYPES } from "@/lib/timeline";

/** Adendo clínico (retificação) vinculado a registro existente. */
export async function createMedicalRecordAmendment(input: {
  tenantId: string;
  patientId: string;
  providerId: string;
  appointmentId?: string | null;
  amendsRecordId: string;
  content: string;
  patientName: string;
}) {
  const prisma = await getPrisma();
  const original = await prisma.medicalRecord.findFirst({
    where: {
      id: input.amendsRecordId,
      patientId: input.patientId,
      patient: { tenantId: input.tenantId },
    },
  });
  if (!original) return null;

  const record = await prisma.medicalRecord.create({
    data: {
      patientId: input.patientId,
      providerId: input.providerId,
      appointmentId: input.appointmentId ?? original.appointmentId,
      recordType: "RETIFICACAO",
      title: `Retificação — ${original.title ?? "registro clínico"}`,
      content: input.content.trim(),
    },
  });

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.MEDICAL_RECORD,
    entityId: record.id,
    action: TIMELINE_ACTIONS.MEDICAL_RECORD_CREATED,
    description: `Retificação de prontuário para ${input.patientName} (ref. ${original.id.slice(0, 8)}…)`,
    createdBy: input.providerId,
    metadata: { amendsRecordId: original.id },
    reversible: false,
  });

  return { record };
}
