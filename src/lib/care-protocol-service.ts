import "server-only";
import { getPrisma } from "@/lib/db";
import {
  parseJsonArray,
  parseJsonObject,
  type ProtocolChecklistItem,
  PROTOCOL_ENROLLMENT_STATUSES,
  protocolStatusLabel,
  type ProtocolEnrollmentStatus,
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

export type ProtocolTemplateView = {
  id: string;
  name: string;
  specialty: string | null;
  checklist: ProtocolChecklistItem[];
  suggestedReturnDays: number | null;
  active: boolean;
};

export type ProtocolEnrollmentView = {
  id: string;
  templateId: string;
  templateName: string;
  specialty: string | null;
  status: string;
  statusLabel: string;
  checklist: ProtocolChecklistItem[];
  checklistState: Record<string, boolean>;
  progressPercent: number;
  startedAt: string;
  startedAtLabel: string;
  nextReviewAt: string | null;
  nextReviewAtLabel: string | null;
  appointmentId: string | null;
  providerName: string;
};

function checklistProgress(
  checklist: ProtocolChecklistItem[],
  state: Record<string, boolean>,
): number {
  if (checklist.length === 0) return 0;
  const done = checklist.filter((item) => state[item.id]).length;
  return Math.round((done / checklist.length) * 100);
}

function mapTemplate(row: {
  id: string;
  name: string;
  specialty: string | null;
  checklist: string;
  suggestedReturnDays: number | null;
  active: boolean;
}): ProtocolTemplateView {
  return {
    id: row.id,
    name: row.name,
    specialty: row.specialty,
    checklist: parseJsonArray<ProtocolChecklistItem>(row.checklist),
    suggestedReturnDays: row.suggestedReturnDays,
    active: row.active,
  };
}

function mapEnrollment(row: {
  id: string;
  templateId: string;
  status: string;
  checklistState: string;
  startedAt: Date;
  nextReviewAt: Date | null;
  appointmentId: string | null;
  provider: { name: string };
  template: { name: string; specialty: string | null; checklist: string };
}): ProtocolEnrollmentView {
  const checklist = parseJsonArray<ProtocolChecklistItem>(row.template.checklist);
  const checklistState = parseJsonObject(row.checklistState);

  return {
    id: row.id,
    templateId: row.templateId,
    templateName: row.template.name,
    specialty: row.template.specialty,
    status: row.status,
    statusLabel: protocolStatusLabel(row.status),
    checklist,
    checklistState,
    progressPercent: checklistProgress(checklist, checklistState),
    startedAt: row.startedAt.toISOString(),
    startedAtLabel: dateOnly(row.startedAt),
    nextReviewAt: row.nextReviewAt?.toISOString() ?? null,
    nextReviewAtLabel: row.nextReviewAt ? dateOnly(row.nextReviewAt) : null,
    appointmentId: row.appointmentId,
    providerName: row.provider.name,
  };
}

export async function listProtocolTemplates(
  tenantId: string,
  activeOnly = true,
): Promise<ProtocolTemplateView[]> {
  const prisma = await getPrisma();
  const rows = await prisma.careProtocolTemplate.findMany({
    where: { tenantId, ...(activeOnly ? { active: true } : {}) },
    orderBy: { name: "asc" },
  });
  return rows.map(mapTemplate);
}

export async function createProtocolTemplate(input: {
  tenantId: string;
  name: string;
  specialty?: string | null;
  checklist: ProtocolChecklistItem[];
  suggestedReturnDays?: number | null;
}): Promise<ProtocolTemplateView> {
  const prisma = await getPrisma();
  const row = await prisma.careProtocolTemplate.create({
    data: {
      tenantId: input.tenantId,
      name: input.name.trim(),
      specialty: input.specialty?.trim() || null,
      checklist: JSON.stringify(input.checklist),
      suggestedReturnDays: input.suggestedReturnDays ?? null,
    },
  });
  return mapTemplate(row);
}

export async function updateProtocolTemplate(input: {
  id: string;
  tenantId: string;
  name?: string;
  specialty?: string | null;
  checklist?: ProtocolChecklistItem[];
  suggestedReturnDays?: number | null;
  active?: boolean;
}): Promise<ProtocolTemplateView | null> {
  const prisma = await getPrisma();
  const existing = await prisma.careProtocolTemplate.findFirst({
    where: { id: input.id, tenantId: input.tenantId },
  });
  if (!existing) return null;

  const row = await prisma.careProtocolTemplate.update({
    where: { id: input.id },
    data: {
      name: input.name?.trim(),
      specialty: input.specialty !== undefined ? input.specialty?.trim() || null : undefined,
      checklist: input.checklist !== undefined ? JSON.stringify(input.checklist) : undefined,
      suggestedReturnDays:
        input.suggestedReturnDays !== undefined ? input.suggestedReturnDays : undefined,
      active: input.active,
    },
  });
  return mapTemplate(row);
}

export async function listPatientProtocolEnrollments(
  patientId: string,
  tenantId: string,
  options?: { status?: ProtocolEnrollmentStatus },
): Promise<ProtocolEnrollmentView[]> {
  const prisma = await getPrisma();
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, tenantId },
  });
  if (!patient) return [];

  const rows = await prisma.patientProtocolEnrollment.findMany({
    where: {
      patientId,
      ...(options?.status ? { status: options.status } : {}),
    },
    include: {
      provider: { select: { name: true } },
      template: { select: { name: true, specialty: true, checklist: true } },
    },
    orderBy: { startedAt: "desc" },
  });

  return rows.map(mapEnrollment);
}

export async function enrollPatientInProtocol(input: {
  patientId: string;
  tenantId: string;
  providerId: string;
  templateId: string;
  appointmentId?: string | null;
  patientName: string;
}): Promise<ProtocolEnrollmentView> {
  const prisma = await getPrisma();
  const template = await prisma.careProtocolTemplate.findFirst({
    where: { id: input.templateId, tenantId: input.tenantId, active: true },
  });
  if (!template) throw new Error("Protocolo não encontrado");

  const nextReviewAt =
    template.suggestedReturnDays && template.suggestedReturnDays > 0
      ? new Date(Date.now() + template.suggestedReturnDays * 86_400_000)
      : null;

  const row = await prisma.patientProtocolEnrollment.create({
    data: {
      patientId: input.patientId,
      templateId: input.templateId,
      providerId: input.providerId,
      appointmentId: input.appointmentId ?? null,
      nextReviewAt,
    },
    include: {
      provider: { select: { name: true } },
      template: { select: { name: true, specialty: true, checklist: true } },
    },
  });

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.CARE_PROTOCOL,
    entityId: row.id,
    action: TIMELINE_ACTIONS.PROTOCOL_STARTED,
    description: `Protocolo ${template.name} iniciado para ${input.patientName}`,
    createdBy: input.providerId,
  });

  return mapEnrollment(row);
}

export async function updateProtocolChecklist(input: {
  id: string;
  tenantId: string;
  providerId: string;
  patientName: string;
  checklistState: Record<string, boolean>;
  status?: ProtocolEnrollmentStatus;
}): Promise<ProtocolEnrollmentView | null> {
  const prisma = await getPrisma();
  const existing = await prisma.patientProtocolEnrollment.findFirst({
    where: {
      id: input.id,
      patient: { tenantId: input.tenantId },
    },
    include: { template: true },
  });
  if (!existing) return null;

  if (input.status && !PROTOCOL_ENROLLMENT_STATUSES.includes(input.status)) return null;

  const row = await prisma.patientProtocolEnrollment.update({
    where: { id: input.id },
    data: {
      checklistState: JSON.stringify(input.checklistState),
      status: input.status,
    },
    include: {
      provider: { select: { name: true } },
      template: { select: { name: true, specialty: true, checklist: true } },
    },
  });

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.CARE_PROTOCOL,
    entityId: row.id,
    action: TIMELINE_ACTIONS.PROTOCOL_UPDATED,
    description: `Protocolo ${existing.template.name} atualizado — ${input.patientName}`,
    createdBy: input.providerId,
  });

  return mapEnrollment(row);
}
