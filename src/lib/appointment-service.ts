import "server-only";
import { getPrisma } from "@/lib/db";
import { recordTimelineEvent, TIMELINE_ACTIONS, TIMELINE_ENTITY_TYPES } from "@/lib/timeline";
import { dispatchWebhooks } from "@/lib/webhook-service";
import {
  buildTelemedicineUrl,
  isAppointmentModality,
  type AppointmentModality,
} from "@/lib/telemedicine";

const dateTime = (value: Date) =>
  value.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const APPOINTMENT_STATUSES = [
  "AGENDADO",
  "CONFIRMADO",
  "REALIZADO",
  "FALTOU",
  "CANCELADO",
] as const;

export function isAppointmentStatus(value: string): boolean {
  return (APPOINTMENT_STATUSES as readonly string[]).includes(value);
}

export type AppointmentView = {
  id: string;
  scheduledAt: string;
  scheduledAtLabel: string;
  status: string;
  modality: string;
  telemedicineUrl: string | null;
  reason: string | null;
  procedureId: string | null;
  procedureName: string | null;
  patientId: string;
  patientName: string;
  providerId: string;
  providerName: string;
  companyName: string | null;
};

function mapAppointment(a: {
  id: string;
  scheduledAt: Date;
  status: string;
  modality: string;
  telemedicineUrl: string | null;
  reason: string | null;
  procedureId: string | null;
  patientId: string;
  providerId: string;
  patient: { name: string; company: { name: string } | null };
  provider: { name: string };
  procedure?: { name: string } | null;
}): AppointmentView {
  return {
    id: a.id,
    scheduledAt: a.scheduledAt.toISOString(),
    scheduledAtLabel: dateTime(a.scheduledAt),
    status: a.status,
    modality: a.modality,
    telemedicineUrl: a.telemedicineUrl,
    reason: a.reason,
    procedureId: a.procedureId,
    procedureName: a.procedure?.name ?? null,
    patientId: a.patientId,
    patientName: a.patient.name,
    providerId: a.providerId,
    providerName: a.provider.name,
    companyName: a.patient.company?.name ?? null,
  };
}

export async function listAppointments(input: {
  tenantId: string;
  from?: Date;
  to?: Date;
  providerId?: string;
  patientId?: string;
}): Promise<AppointmentView[]> {
  const prisma = await getPrisma();
  const where: {
    tenantId: string;
    scheduledAt?: { gte?: Date; lte?: Date };
    providerId?: string;
    patientId?: string;
  } = { tenantId: input.tenantId };

  if (input.from || input.to) {
    where.scheduledAt = {};
    if (input.from) where.scheduledAt.gte = input.from;
    if (input.to) where.scheduledAt.lte = input.to;
  }
  if (input.providerId) where.providerId = input.providerId;
  if (input.patientId) where.patientId = input.patientId;

  const rows = await prisma.appointment.findMany({
    where,
    include: {
      patient: { include: { company: true } },
      provider: { select: { name: true } },
      procedure: { select: { name: true } },
    },
    orderBy: { scheduledAt: "asc" },
  });

  return rows.map(mapAppointment);
}

export async function listProviders(tenantId: string) {
  const prisma = await getPrisma();
  return prisma.user.findMany({
    where: { tenantId, role: "PRESTADOR" },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
}

async function findAvailableProviderAt(input: {
  tenantId: string;
  scheduledAt: Date;
}): Promise<{ id: string; name: string } | null> {
  const prisma = await getPrisma();
  const providers = await prisma.user.findMany({
    where: { tenantId: input.tenantId, role: "PRESTADOR" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  for (const provider of providers) {
    const conflict = await prisma.appointment.findFirst({
      where: {
        tenantId: input.tenantId,
        providerId: provider.id,
        scheduledAt: input.scheduledAt,
        status: { notIn: ["CANCELADO", "FALTOU"] },
      },
      select: { id: true },
    });
    if (!conflict) return provider;
  }

  return null;
}

export async function createAppointment(input: {
  tenantId: string;
  patientId: string;
  providerId?: string;
  procedureId?: string;
  scheduledAt: Date;
  reason?: string | null;
  status?: string;
  modality?: string;
  autoAssignProvider?: boolean;
  createdBy: string;
}) {
  const prisma = await getPrisma();
  const patient = await prisma.patient.findFirst({
    where: { id: input.patientId, tenantId: input.tenantId },
  });
  if (!patient) return { error: "Paciente não encontrado" as const };

  let procedureName: string | null = null;
  if (input.procedureId) {
    const procedure = await prisma.procedure.findFirst({
      where: { id: input.procedureId, tenantId: input.tenantId },
      select: { id: true, name: true },
    });
    if (!procedure) return { error: "Procedimento não encontrado" as const };
    procedureName = procedure.name;
  }

  let providerId = input.providerId;
  if (!providerId) {
    if (!input.autoAssignProvider) {
      return { error: "Informe o prestador ou ative atribuição automática" as const };
    }
    const assigned = await findAvailableProviderAt({
      tenantId: input.tenantId,
      scheduledAt: input.scheduledAt,
    });
    if (!assigned) {
      return { error: "Nenhum prestador disponível neste horário" as const };
    }
    providerId = assigned.id;
  }

  const provider = await prisma.user.findFirst({
    where: { id: providerId, tenantId: input.tenantId, role: "PRESTADOR" },
  });
  if (!provider) return { error: "Prestador não encontrado" as const };

  const conflict = await prisma.appointment.findFirst({
    where: {
      tenantId: input.tenantId,
      providerId,
      scheduledAt: input.scheduledAt,
      status: { notIn: ["CANCELADO", "FALTOU"] },
    },
  });
  if (conflict) return { error: "Horário indisponível para este prestador" as const };

  const modality: AppointmentModality =
    input.modality && isAppointmentModality(input.modality) ? input.modality : "PRESENCIAL";

  const reason =
    input.reason?.trim() ||
    (procedureName ? `Procedimento: ${procedureName}` : null);

  const appointment = await prisma.appointment.create({
    data: {
      tenantId: input.tenantId,
      patientId: input.patientId,
      providerId,
      procedureId: input.procedureId ?? null,
      scheduledAt: input.scheduledAt,
      reason,
      status: input.status ?? "AGENDADO",
      modality,
      telemedicineUrl: null,
    },
    include: {
      patient: { include: { company: true } },
      provider: { select: { name: true } },
      procedure: { select: { name: true } },
    },
  });

  let finalAppointment = appointment;
  if (modality === "TELE") {
    const teleUrl = buildTelemedicineUrl(appointment.id);
    finalAppointment = await prisma.appointment.update({
      where: { id: appointment.id },
      data: { telemedicineUrl: teleUrl },
      include: {
        patient: { include: { company: true } },
        provider: { select: { name: true } },
        procedure: { select: { name: true } },
      },
    });
  }

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.APPOINTMENT,
    entityId: finalAppointment.id,
    action: TIMELINE_ACTIONS.CREATED,
    description: `Consulta agendada: ${patient.name} com ${provider.name} (${dateTime(finalAppointment.scheduledAt)})`,
    createdBy: input.createdBy,
  });

  void dispatchWebhooks({
    tenantId: input.tenantId,
    event: "APPOINTMENT_CREATED",
    data: {
      appointmentId: finalAppointment.id,
      patientId: finalAppointment.patientId,
      providerId: finalAppointment.providerId,
      status: finalAppointment.status,
      modality: finalAppointment.modality,
      telemedicineUrl: finalAppointment.telemedicineUrl,
      scheduledAt: finalAppointment.scheduledAt.toISOString(),
    },
  });

  return { appointment: mapAppointment(finalAppointment) };
}

export async function updateAppointment(input: {
  tenantId: string;
  appointmentId: string;
  scheduledAt?: Date;
  status?: string;
  reason?: string | null;
  createdBy: string;
}) {
  const prisma = await getPrisma();
  const existing = await prisma.appointment.findFirst({
    where: { id: input.appointmentId, tenantId: input.tenantId },
    include: { patient: true, provider: true },
  });
  if (!existing) return null;

  if (input.scheduledAt) {
    const conflict = await prisma.appointment.findFirst({
      where: {
        tenantId: input.tenantId,
        providerId: existing.providerId,
        scheduledAt: input.scheduledAt,
        status: { notIn: ["CANCELADO", "FALTOU"] },
        NOT: { id: existing.id },
      },
    });
    if (conflict) return { error: "Horário indisponível" as const };
  }

  const appointment = await prisma.appointment.update({
    where: { id: existing.id },
    data: {
      scheduledAt: input.scheduledAt,
      status: input.status,
      reason: input.reason === undefined ? undefined : input.reason?.trim() || null,
    },
    include: {
      patient: { include: { company: true } },
      provider: { select: { name: true } },
      procedure: { select: { name: true } },
    },
  });

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.APPOINTMENT,
    entityId: appointment.id,
    action: TIMELINE_ACTIONS.UPDATED,
    description: `Agendamento ${existing.patient.name}: status ${existing.status} → ${appointment.status}`,
    createdBy: input.createdBy,
  });

  return { appointment: mapAppointment(appointment) };
}
