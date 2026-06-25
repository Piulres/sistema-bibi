import "server-only";
import { getPrisma } from "@/lib/db";
import {
  VACCINE_STATUSES,
  vaccineStatusLabel,
  type VaccineStatus,
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

export type PetVaccineView = {
  id: string;
  petId: string;
  vaccineName: string;
  doseLabel: string | null;
  status: string;
  statusLabel: string;
  appliedAt: string | null;
  appliedAtLabel: string | null;
  nextDueAt: string | null;
  nextDueAtLabel: string | null;
  batchNumber: string | null;
  notes: string | null;
  providerName: string | null;
  appointmentId: string | null;
  createdAt: string;
};

function mapVaccine(row: {
  id: string;
  petId: string;
  vaccineName: string;
  doseLabel: string | null;
  status: string;
  appliedAt: Date | null;
  nextDueAt: Date | null;
  batchNumber: string | null;
  notes: string | null;
  appointmentId: string | null;
  createdAt: Date;
  provider?: { name: string } | null;
}): PetVaccineView {
  return {
    id: row.id,
    petId: row.petId,
    vaccineName: row.vaccineName,
    doseLabel: row.doseLabel,
    status: row.status,
    statusLabel: vaccineStatusLabel(row.status),
    appliedAt: row.appliedAt?.toISOString() ?? null,
    appliedAtLabel: row.appliedAt ? dateOnly(row.appliedAt) : null,
    nextDueAt: row.nextDueAt?.toISOString() ?? null,
    nextDueAtLabel: row.nextDueAt ? dateOnly(row.nextDueAt) : null,
    batchNumber: row.batchNumber,
    notes: row.notes,
    providerName: row.provider?.name ?? null,
    appointmentId: row.appointmentId,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listPetVaccines(
  petId: string,
  tenantId: string,
  options?: { status?: VaccineStatus },
): Promise<PetVaccineView[]> {
  const prisma = await getPrisma();
  const pet = await prisma.pet.findFirst({
    where: { id: petId, tenantId },
  });
  if (!pet) return [];

  const rows = await prisma.petVaccineRecord.findMany({
    where: {
      petId,
      ...(options?.status ? { status: options.status } : {}),
    },
    include: { provider: { select: { name: true } } },
    orderBy: [{ appliedAt: "desc" }, { createdAt: "desc" }],
  });

  return rows.map(mapVaccine);
}

export async function createPetVaccine(input: {
  petId: string;
  tenantId: string;
  providerId: string;
  appointmentId?: string | null;
  vaccineName: string;
  doseLabel?: string | null;
  appliedAt?: string | null;
  nextDueAt?: string | null;
  batchNumber?: string | null;
  notes?: string | null;
  status?: VaccineStatus;
  petName: string;
}): Promise<PetVaccineView> {
  const prisma = await getPrisma();
  const status = input.status ?? "APLICADA";
  if (!VACCINE_STATUSES.includes(status)) {
    throw new Error("Status de vacina inválido");
  }

  const row = await prisma.petVaccineRecord.create({
    data: {
      petId: input.petId,
      providerId: input.providerId,
      appointmentId: input.appointmentId ?? null,
      vaccineName: input.vaccineName.trim(),
      doseLabel: input.doseLabel?.trim() || null,
      appliedAt: input.appliedAt ? new Date(input.appliedAt) : status === "APLICADA" ? new Date() : null,
      nextDueAt: input.nextDueAt ? new Date(input.nextDueAt) : null,
      batchNumber: input.batchNumber?.trim() || null,
      notes: input.notes?.trim() || null,
      status,
    },
    include: { provider: { select: { name: true } } },
  });

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.PATIENT,
    entityId: (
      await prisma.pet.findUnique({ where: { id: input.petId }, select: { patientId: true } })
    )?.patientId ?? input.petId,
    action: TIMELINE_ACTIONS.CREATED,
    description: `Vacina ${row.vaccineName} registrada para ${input.petName}`,
    createdBy: input.providerId,
  });

  return mapVaccine(row);
}

export async function updatePetVaccine(input: {
  id: string;
  tenantId: string;
  providerId: string;
  petName: string;
  status?: VaccineStatus;
  appliedAt?: string | null;
  nextDueAt?: string | null;
  resultSummary?: string;
}): Promise<PetVaccineView | null> {
  const prisma = await getPrisma();
  const existing = await prisma.petVaccineRecord.findFirst({
    where: {
      id: input.id,
      pet: { tenantId: input.tenantId },
    },
  });
  if (!existing) return null;

  if (input.status && !VACCINE_STATUSES.includes(input.status)) return null;

  const row = await prisma.petVaccineRecord.update({
    where: { id: input.id },
    data: {
      status: input.status,
      appliedAt:
        input.appliedAt !== undefined
          ? input.appliedAt
            ? new Date(input.appliedAt)
            : null
          : undefined,
      nextDueAt:
        input.nextDueAt !== undefined
          ? input.nextDueAt
            ? new Date(input.nextDueAt)
            : null
          : undefined,
      notes: input.resultSummary !== undefined ? input.resultSummary : undefined,
    },
    include: { provider: { select: { name: true } } },
  });

  return mapVaccine(row);
}
