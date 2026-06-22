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
  patientId: string;
  providerId: string;
  patient: { name: string; company: { name: string } | null };
  provider: { name: string };
}): AppointmentView {
  return {
    id: a.id,
    scheduledAt: a.scheduledAt.toISOString(),
    scheduledAtLabel: dateTime(a.scheduledAt),
    status: a.status,
    modality: a.modality,
    telemedicineUrl: a.telemedicineUrl,
    reason: a.reason,
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

export async function createAppointment(input: {
  tenantId: string;
  patientId: string;
  providerId: string;
  scheduledAt: Date;
  reason?: string | null;
  status?: string;
  modality?: string;
  createdBy: string;
}) {
  const prisma = await getPrisma();
  const patient = await prisma.patient.findFirst({
    where: { id: input.patientId, tenantId: input.tenantId },
  });
  if (!patient) return { error: "Paciente não encontrado" as const };

  const provider = await prisma.user.findFirst({
    where: { id: input.providerId, tenantId: input.tenantId, role: "PRESTADOR" },
  });
  if (!provider) return { error: "Prestador não encontrado" as const };

  const conflict = await prisma.appointment.findFirst({
    where: {
      tenantId: input.tenantId,
      providerId: input.providerId,
      scheduledAt: input.scheduledAt,
      status: { notIn: ["CANCELADO", "FALTOU"] },
    },
  });
  if (conflict) return { error: "Horário indisponível para este prestador" as const };

  const modality: AppointmentModality =
    input.modality && isAppointmentModality(input.modality) ? input.modality : "PRESENCIAL";

  const appointment = await prisma.appointment.create({
    data: {
      tenantId: input.tenantId,
      patientId: input.patientId,
      providerId: input.providerId,
      scheduledAt: input.scheduledAt,
      reason: input.reason?.trim() || null,
      status: input.status ?? "AGENDADO",
      modality,
      telemedicineUrl: null,
    },
    include: {
      patient: { include: { company: true } },
      provider: { select: { name: true } },
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
