import "server-only";
import { getPrisma } from "@/lib/db";
import {
  EXAM_ORDER_STATUSES,
  examOrderStatusLabel,
  type ExamOrderStatus,
} from "@/lib/clinical/constants";
import {
  recordTimelineEvent,
  TIMELINE_ACTIONS,
  TIMELINE_ENTITY_TYPES,
} from "@/lib/timeline";

const dateTime = (value: Date) =>
  value.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export type ExamOrderView = {
  id: string;
  examName: string;
  status: string;
  statusLabel: string;
  clinicalIndication: string | null;
  scheduledAt: string | null;
  scheduledAtLabel: string | null;
  resultSummary: string | null;
  hasAttachment: boolean;
  reviewedAt: string | null;
  reviewedAtLabel: string | null;
  appointmentId: string | null;
  procedureId: string | null;
  procedureName: string | null;
  providerName: string;
  createdAt: string;
  createdAtLabel: string;
};

function mapExamOrder(
  row: {
    id: string;
    examName: string;
    status: string;
    clinicalIndication: string | null;
    scheduledAt: Date | null;
    resultSummary: string | null;
    resultAttachmentKey: string | null;
    reviewedAt: Date | null;
    appointmentId: string | null;
    procedureId: string | null;
    createdAt: Date;
    provider: { name: string };
    procedure?: { name: string } | null;
  },
): ExamOrderView {
  return {
    id: row.id,
    examName: row.examName,
    status: row.status,
    statusLabel: examOrderStatusLabel(row.status),
    clinicalIndication: row.clinicalIndication,
    scheduledAt: row.scheduledAt?.toISOString() ?? null,
    scheduledAtLabel: row.scheduledAt ? dateTime(row.scheduledAt) : null,
    resultSummary: row.resultSummary,
    hasAttachment: Boolean(row.resultAttachmentKey),
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    reviewedAtLabel: row.reviewedAt ? dateTime(row.reviewedAt) : null,
    appointmentId: row.appointmentId,
    procedureId: row.procedureId,
    procedureName: row.procedure?.name ?? null,
    providerName: row.provider.name,
    createdAt: row.createdAt.toISOString(),
    createdAtLabel: dateTime(row.createdAt),
  };
}

export async function listPatientExamOrders(
  patientId: string,
  tenantId: string,
  options?: { status?: ExamOrderStatus; appointmentId?: string; petId?: string; tutorOnly?: boolean },
): Promise<ExamOrderView[]> {
  const prisma = await getPrisma();
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, tenantId },
  });
  if (!patient) return [];

  const rows = await prisma.examOrder.findMany({
    where: {
      patientId,
      ...(options?.status ? { status: options.status } : {}),
      ...(options?.appointmentId ? { appointmentId: options.appointmentId } : {}),
      ...(options?.petId ? { petId: options.petId } : {}),
      ...(options?.tutorOnly ? { petId: null } : {}),
    },
    include: {
      provider: { select: { name: true } },
      procedure: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map(mapExamOrder);
}

export async function createExamOrder(input: {
  patientId: string;
  tenantId: string;
  providerId: string;
  appointmentId?: string | null;
  petId?: string | null;
  procedureId?: string | null;
  examName: string;
  clinicalIndication?: string | null;
  patientName: string;
}): Promise<ExamOrderView> {
  const prisma = await getPrisma();
  let examName = input.examName.trim();

  if (input.petId) {
    const pet = await prisma.pet.findFirst({
      where: { id: input.petId, tenantId: input.tenantId, patientId: input.patientId },
    });
    if (!pet) throw new Error("Pet não encontrado");
  }

  if (input.procedureId) {
    const procedure = await prisma.procedure.findFirst({
      where: { id: input.procedureId, tenantId: input.tenantId },
    });
    if (!procedure) throw new Error("Procedimento não encontrado");
    if (!examName) examName = procedure.name;
  }

  const row = await prisma.examOrder.create({
    data: {
      patientId: input.patientId,
      petId: input.petId ?? null,
      providerId: input.providerId,
      appointmentId: input.appointmentId ?? null,
      procedureId: input.procedureId ?? null,
      examName,
      clinicalIndication: input.clinicalIndication?.trim() || null,
    },
    include: {
      provider: { select: { name: true } },
      procedure: { select: { name: true } },
    },
  });

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.EXAM_ORDER,
    entityId: row.id,
    action: TIMELINE_ACTIONS.EXAM_ORDERED,
    description: `Exame ${row.examName} solicitado para ${input.patientName}`,
    createdBy: input.providerId,
  });

  return mapExamOrder(row);
}

export async function updateExamOrder(input: {
  id: string;
  tenantId: string;
  providerId: string;
  patientName: string;
  status?: ExamOrderStatus;
  scheduledAt?: string | null;
  resultSummary?: string | null;
  resultAttachmentKey?: string | null;
  markReviewed?: boolean;
}): Promise<ExamOrderView | null> {
  const prisma = await getPrisma();
  const existing = await prisma.examOrder.findFirst({
    where: {
      id: input.id,
      patient: { tenantId: input.tenantId },
    },
  });
  if (!existing) return null;

  if (input.status && !EXAM_ORDER_STATUSES.includes(input.status)) return null;

  const row = await prisma.examOrder.update({
    where: { id: input.id },
    data: {
      status: input.status,
      scheduledAt:
        input.scheduledAt !== undefined
          ? input.scheduledAt
            ? new Date(input.scheduledAt)
            : null
          : undefined,
      resultSummary:
        input.resultSummary !== undefined ? input.resultSummary?.trim() || null : undefined,
      resultAttachmentKey:
        input.resultAttachmentKey !== undefined ? input.resultAttachmentKey : undefined,
      reviewedAt: input.markReviewed ? new Date() : undefined,
    },
    include: {
      provider: { select: { name: true } },
      procedure: { select: { name: true } },
    },
  });

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.EXAM_ORDER,
    entityId: row.id,
    action: TIMELINE_ACTIONS.EXAM_UPDATED,
    description: `Exame ${row.examName} (${examOrderStatusLabel(row.status)}) — ${input.patientName}`,
    createdBy: input.providerId,
  });

  return mapExamOrder(row);
}

/** Cancela pedido de exame ainda não realizado. */
export async function cancelExamOrder(input: {
  id: string;
  tenantId: string;
  providerId: string;
  patientName: string;
}): Promise<ExamOrderView | null> {
  return updateExamOrder({
    id: input.id,
    tenantId: input.tenantId,
    providerId: input.providerId,
    patientName: input.patientName,
    status: "CANCELADO",
  });
}
