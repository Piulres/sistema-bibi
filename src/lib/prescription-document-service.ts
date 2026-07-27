import "server-only";
import { getPrisma } from "@/lib/db";
import {
  isPrescriptionKind,
  prescriptionKindLabel,
  type PrescriptionKind,
} from "@/lib/clinical/receita";
import {
  recordTimelineEvent,
  TIMELINE_ACTIONS,
  TIMELINE_ENTITY_TYPES,
} from "@/lib/timeline";

export type PrescriptionItemInput = {
  medication: string;
  dosage: string;
  frequency: string;
  route?: string | null;
  durationDays?: number | null;
  quantity?: string | null;
  notes?: string | null;
};

export type PrescriptionDocumentItemView = {
  id: string;
  sortOrder: number;
  medication: string;
  dosage: string;
  frequency: string;
  route: string | null;
  durationDays: number | null;
  quantity: string | null;
  notes: string | null;
};

export type PrescriptionDocumentView = {
  id: string;
  prescriptionKind: string;
  prescriptionKindLabel: string;
  title: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
  createdAtLabel: string;
  appointmentId: string | null;
  providerName: string;
  items: PrescriptionDocumentItemView[];
  itemCount: number;
};

const dateOnly = (value: Date) =>
  value.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

function mapDocument(
  row: {
    id: string;
    prescriptionKind: string;
    title: string | null;
    notes: string | null;
    status: string;
    createdAt: Date;
    appointmentId: string | null;
    provider: { name: string };
    items: {
      id: string;
      sortOrder: number;
      medication: string;
      dosage: string;
      frequency: string;
      route: string | null;
      durationDays: number | null;
      quantity: string | null;
      notes: string | null;
    }[];
  },
): PrescriptionDocumentView {
  const kind: PrescriptionKind =
    row.prescriptionKind && isPrescriptionKind(row.prescriptionKind)
      ? row.prescriptionKind
      : "COMUM";

  return {
    id: row.id,
    prescriptionKind: kind,
    prescriptionKindLabel: prescriptionKindLabel(kind),
    title: row.title,
    notes: row.notes,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    createdAtLabel: dateOnly(row.createdAt),
    appointmentId: row.appointmentId,
    providerName: row.provider.name,
    items: row.items.map((item) => ({
      id: item.id,
      sortOrder: item.sortOrder,
      medication: item.medication,
      dosage: item.dosage,
      frequency: item.frequency,
      route: item.route,
      durationDays: item.durationDays,
      quantity: item.quantity,
      notes: item.notes,
    })),
    itemCount: row.items.length,
  };
}

export async function listPrescriptionDocuments(
  patientId: string,
  tenantId: string,
  options?: { appointmentId?: string; petId?: string },
): Promise<PrescriptionDocumentView[]> {
  const prisma = await getPrisma();
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, tenantId },
  });
  if (!patient) return [];

  const rows = await prisma.prescriptionDocument.findMany({
    where: {
      patientId,
      ...(options?.appointmentId ? { appointmentId: options.appointmentId } : {}),
      ...(options?.petId ? { petId: options.petId } : {}),
    },
    include: {
      provider: { select: { name: true } },
      items: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map(mapDocument);
}

export async function createPrescriptionDocument(input: {
  patientId: string;
  tenantId: string;
  providerId: string;
  appointmentId?: string | null;
  petId?: string | null;
  prescriptionKind?: PrescriptionKind | string | null;
  title?: string | null;
  notes?: string | null;
  items: PrescriptionItemInput[];
  patientName: string;
}): Promise<PrescriptionDocumentView> {
  const prisma = await getPrisma();

  const validItems = input.items
    .map((item, index) => ({
      sortOrder: index,
      medication: item.medication?.trim() ?? "",
      dosage: item.dosage?.trim() ?? "",
      frequency: item.frequency?.trim() ?? "",
      route: item.route?.trim() || null,
      durationDays: item.durationDays ?? null,
      quantity: item.quantity?.trim() || null,
      notes: item.notes?.trim() || null,
    }))
    .filter((item) => item.medication && item.dosage && item.frequency);

  if (validItems.length === 0) {
    throw new Error("Informe ao menos um medicamento com dose e frequência");
  }

  const kind: PrescriptionKind =
    input.prescriptionKind && isPrescriptionKind(input.prescriptionKind)
      ? input.prescriptionKind
      : "COMUM";

  if (input.petId) {
    const pet = await prisma.pet.findFirst({
      where: { id: input.petId, tenantId: input.tenantId, patientId: input.patientId },
    });
    if (!pet) throw new Error("Pet não encontrado");
  }

  const row = await prisma.prescriptionDocument.create({
    data: {
      patientId: input.patientId,
      petId: input.petId ?? null,
      providerId: input.providerId,
      appointmentId: input.appointmentId ?? null,
      prescriptionKind: kind,
      title: input.title?.trim() || null,
      notes: input.notes?.trim() || null,
      items: {
        create: validItems,
      },
    },
    include: {
      provider: { select: { name: true } },
      items: { orderBy: { sortOrder: "asc" } },
    },
  });

  // Mantém compatibilidade com visão de medicações ativas (1 linha por item).
  for (const item of validItems) {
    const endDate =
      item.durationDays && item.durationDays > 0
        ? new Date(Date.now() + item.durationDays * 86_400_000)
        : null;

    await prisma.medicationPrescription.create({
      data: {
        patientId: input.patientId,
        petId: input.petId ?? null,
        providerId: input.providerId,
        appointmentId: input.appointmentId ?? null,
        prescriptionKind: kind,
        medication: item.medication,
        dosage: item.dosage,
        frequency: item.frequency,
        route: item.route,
        durationDays: item.durationDays,
        quantity: item.quantity,
        notes: item.notes,
        endDate,
      },
    });
  }

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.MEDICATION_PRESCRIPTION,
    entityId: row.id,
    action: TIMELINE_ACTIONS.MEDICATION_PRESCRIBED,
    description: `Receita (${prescriptionKindLabel(kind)}) com ${validItems.length} item(ns) — ${input.patientName}`,
    createdBy: input.providerId,
  });

  return mapDocument(row);
}

/** Texto formatado para impressão / PEP. */
export function formatPrescriptionDocumentText(doc: PrescriptionDocumentView): string {
  const lines = [
    doc.title ?? doc.prescriptionKindLabel,
    `Paciente atendido em ${doc.createdAtLabel}`,
    `Prescritor: ${doc.providerName}`,
    "",
  ];

  doc.items.forEach((item, index) => {
    lines.push(
      `${index + 1}. ${item.medication}`,
      `   Dose: ${item.dosage} · ${item.frequency}${item.route ? ` · Via ${item.route}` : ""}`,
    );
    if (item.durationDays) lines.push(`   Duração: ${item.durationDays} dia(s)`);
    if (item.quantity) lines.push(`   Quantidade: ${item.quantity}`);
    if (item.notes) lines.push(`   Obs.: ${item.notes}`);
    lines.push("");
  });

  if (doc.notes) lines.push(`Observações gerais: ${doc.notes}`);
  return lines.join("\n");
}
