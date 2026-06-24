import "server-only";
import { getPrisma } from "@/lib/db";
import {
  MEDICATION_STATUSES,
  medicationStatusLabel,
  type MedicationStatus,
} from "@/lib/clinical/constants";
import {
  recordTimelineEvent,
  TIMELINE_ACTIONS,
  TIMELINE_ENTITY_TYPES,
} from "@/lib/timeline";

const dateOnly = (value: Date) =>
  value.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

export type MedicationView = {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  route: string | null;
  durationDays: number | null;
  notes: string | null;
  status: string;
  statusLabel: string;
  startDate: string;
  startDateLabel: string;
  endDate: string | null;
  endDateLabel: string | null;
  appointmentId: string | null;
  providerName: string;
};

function mapMedication(
  row: {
    id: string;
    medication: string;
    dosage: string;
    frequency: string;
    route: string | null;
    durationDays: number | null;
    notes: string | null;
    status: string;
    startDate: Date;
    endDate: Date | null;
    appointmentId: string | null;
    provider: { name: string };
  },
): MedicationView {
  return {
    id: row.id,
    medication: row.medication,
    dosage: row.dosage,
    frequency: row.frequency,
    route: row.route,
    durationDays: row.durationDays,
    notes: row.notes,
    status: row.status,
    statusLabel: medicationStatusLabel(row.status),
    startDate: row.startDate.toISOString(),
    startDateLabel: dateOnly(row.startDate),
    endDate: row.endDate?.toISOString() ?? null,
    endDateLabel: row.endDate ? dateOnly(row.endDate) : null,
    appointmentId: row.appointmentId,
    providerName: row.provider.name,
  };
}

export async function listPatientMedications(
  patientId: string,
  tenantId: string,
  options?: { status?: MedicationStatus; activeOnly?: boolean; petId?: string },
): Promise<MedicationView[]> {
  const prisma = await getPrisma();
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, tenantId },
  });
  if (!patient) return [];

  const statusFilter = options?.status
    ? { status: options.status }
    : options?.activeOnly
      ? { status: "ATIVA" }
      : {};

  const petFilter = options?.petId ? { petId: options.petId } : {};

  const rows = await prisma.medicationPrescription.findMany({
    where: { patientId, ...statusFilter, ...petFilter },
    include: { provider: { select: { name: true } } },
    orderBy: [{ status: "asc" }, { startDate: "desc" }],
  });

  return rows.map(mapMedication);
}

export async function createMedicationPrescription(input: {
  patientId: string;
  tenantId: string;
  providerId: string;
  appointmentId?: string | null;
  petId?: string | null;
  medication: string;
  dosage: string;
  frequency: string;
  route?: string | null;
  durationDays?: number | null;
  notes?: string | null;
  patientName: string;
}): Promise<MedicationView> {
  const prisma = await getPrisma();

  if (input.petId) {
    const pet = await prisma.pet.findFirst({
      where: { id: input.petId, tenantId: input.tenantId, patientId: input.patientId },
    });
    if (!pet) throw new Error("Pet não encontrado");
  }

  const endDate =
    input.durationDays && input.durationDays > 0
      ? new Date(Date.now() + input.durationDays * 86_400_000)
      : null;

  const row = await prisma.medicationPrescription.create({
    data: {
      patientId: input.patientId,
      petId: input.petId ?? null,
      providerId: input.providerId,
      appointmentId: input.appointmentId ?? null,
      medication: input.medication.trim(),
      dosage: input.dosage.trim(),
      frequency: input.frequency.trim(),
      route: input.route?.trim() || null,
      durationDays: input.durationDays ?? null,
      notes: input.notes?.trim() || null,
      endDate,
    },
    include: { provider: { select: { name: true } } },
  });

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.MEDICATION_PRESCRIPTION,
    entityId: row.id,
    action: TIMELINE_ACTIONS.MEDICATION_PRESCRIBED,
    description: `Prescrição de ${row.medication} para ${input.patientName}`,
    createdBy: input.providerId,
  });

  return mapMedication(row);
}

export async function updateMedicationStatus(input: {
  id: string;
  tenantId: string;
  providerId: string;
  status: MedicationStatus;
  patientName: string;
}): Promise<MedicationView | null> {
  if (!MEDICATION_STATUSES.includes(input.status)) return null;

  const prisma = await getPrisma();
  const existing = await prisma.medicationPrescription.findFirst({
    where: {
      id: input.id,
      patient: { tenantId: input.tenantId },
    },
    include: { provider: { select: { name: true } }, patient: { select: { name: true } } },
  });
  if (!existing) return null;

  const row = await prisma.medicationPrescription.update({
    where: { id: input.id },
    data: {
      status: input.status,
      endDate: input.status === "ENCERRADA" ? new Date() : existing.endDate,
    },
    include: { provider: { select: { name: true } } },
  });

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.MEDICATION_PRESCRIPTION,
    entityId: row.id,
    action: TIMELINE_ACTIONS.MEDICATION_UPDATED,
    description: `Medicação ${row.medication} (${medicationStatusLabel(input.status)}) — ${input.patientName}`,
    createdBy: input.providerId,
  });

  return mapMedication(row);
}
