import "server-only";
import { getPrisma } from "@/lib/db";
import {
  isReferralKind,
  isReferralUrgency,
  referralKindLabel,
  referralStatusLabel,
  referralUrgencyLabel,
  type ReferralKind,
  type ReferralUrgency,
} from "@/lib/clinical/encaminhamento";
import {
  recordTimelineEvent,
  TIMELINE_ACTIONS,
  TIMELINE_ENTITY_TYPES,
} from "@/lib/timeline";

export type ClinicalReferralView = {
  id: string;
  referralKind: string;
  referralKindLabel: string;
  specialty: string;
  urgency: string;
  urgencyLabel: string;
  clinicalReason: string;
  historySummary: string | null;
  requestedActions: string | null;
  status: string;
  statusLabel: string;
  createdAt: string;
  createdAtLabel: string;
  appointmentId: string | null;
  providerName: string;
  title: string;
};

const dateOnly = (value: Date) =>
  value.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

function mapReferral(row: {
  id: string;
  referralKind: string;
  specialty: string;
  urgency: string;
  clinicalReason: string;
  historySummary: string | null;
  requestedActions: string | null;
  status: string;
  createdAt: Date;
  appointmentId: string | null;
  provider: { name: string };
}): ClinicalReferralView {
  const kind: ReferralKind =
    row.referralKind && isReferralKind(row.referralKind) ? row.referralKind : "ESPECIALIDADE";

  return {
    id: row.id,
    referralKind: kind,
    referralKindLabel: referralKindLabel(kind),
    specialty: row.specialty,
    urgency: row.urgency,
    urgencyLabel: referralUrgencyLabel(row.urgency),
    clinicalReason: row.clinicalReason,
    historySummary: row.historySummary,
    requestedActions: row.requestedActions,
    status: row.status,
    statusLabel: referralStatusLabel(row.status),
    createdAt: row.createdAt.toISOString(),
    createdAtLabel: dateOnly(row.createdAt),
    appointmentId: row.appointmentId,
    providerName: row.provider.name,
    title: `Encaminhamento — ${row.specialty}`,
  };
}

export async function listClinicalReferrals(
  patientId: string,
  tenantId: string,
  options?: { appointmentId?: string; petId?: string; tutorOnly?: boolean },
): Promise<ClinicalReferralView[]> {
  const prisma = await getPrisma();
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, tenantId },
  });
  if (!patient) return [];

  const rows = await prisma.clinicalReferral.findMany({
    where: {
      patientId,
      ...(options?.appointmentId ? { appointmentId: options.appointmentId } : {}),
      ...(options?.petId ? { petId: options.petId } : {}),
      ...(options?.tutorOnly ? { petId: null } : {}),
    },
    include: { provider: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return rows.map(mapReferral);
}

export async function createClinicalReferral(input: {
  patientId: string;
  tenantId: string;
  providerId: string;
  appointmentId?: string | null;
  petId?: string | null;
  referralKind?: string | null;
  specialty: string;
  urgency?: string | null;
  clinicalReason: string;
  historySummary?: string | null;
  requestedActions?: string | null;
  patientName: string;
}): Promise<ClinicalReferralView> {
  const prisma = await getPrisma();

  const specialty = input.specialty.trim();
  const clinicalReason = input.clinicalReason.trim();
  if (!specialty) throw new Error("Informe a especialidade ou serviço de destino");
  if (!clinicalReason) throw new Error("Informe o motivo clínico do encaminhamento");

  const kind: ReferralKind =
    input.referralKind && isReferralKind(input.referralKind)
      ? input.referralKind
      : "ESPECIALIDADE";
  const urgency: ReferralUrgency =
    input.urgency && isReferralUrgency(input.urgency) ? input.urgency : "ROTINA";

  if (input.petId) {
    const pet = await prisma.pet.findFirst({
      where: { id: input.petId, tenantId: input.tenantId, patientId: input.patientId },
    });
    if (!pet) throw new Error("Pet não encontrado");
  }

  const row = await prisma.clinicalReferral.create({
    data: {
      patientId: input.patientId,
      petId: input.petId ?? null,
      providerId: input.providerId,
      appointmentId: input.appointmentId ?? null,
      referralKind: kind,
      specialty,
      urgency,
      clinicalReason,
      historySummary: input.historySummary?.trim() || null,
      requestedActions: input.requestedActions?.trim() || null,
    },
    include: { provider: { select: { name: true } } },
  });

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.CLINICAL_REFERRAL,
    entityId: row.id,
    action: TIMELINE_ACTIONS.REFERRAL_CREATED,
    description: `Encaminhamento para ${specialty} — ${input.patientName}`,
    createdBy: input.providerId,
  });

  return mapReferral(row);
}

export async function cancelClinicalReferral(input: {
  referralId: string;
  tenantId: string;
  providerId?: string;
}): Promise<ClinicalReferralView | null> {
  const prisma = await getPrisma();
  const existing = await prisma.clinicalReferral.findFirst({
    where: {
      id: input.referralId,
      patient: { tenantId: input.tenantId },
      ...(input.providerId ? { providerId: input.providerId } : {}),
    },
    include: { provider: { select: { name: true } }, patient: { select: { name: true } } },
  });
  if (!existing) return null;

  const row = await prisma.clinicalReferral.update({
    where: { id: existing.id },
    data: { status: "CANCELADO" },
    include: { provider: { select: { name: true } } },
  });

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.CLINICAL_REFERRAL,
    entityId: row.id,
    action: TIMELINE_ACTIONS.CANCELLED,
    description: `Encaminhamento cancelado — ${existing.specialty}`,
    createdBy: input.providerId ?? null,
  });

  return mapReferral(row);
}
