import "server-only";
import { getPrisma } from "@/lib/db";
import { createAppointment } from "@/lib/appointment-service";
import {
  recordTimelineEvent,
  TIMELINE_ACTIONS,
  TIMELINE_ENTITY_TYPES,
} from "@/lib/timeline";
import { dispatchWebhooks } from "@/lib/webhook-service";
import { queueAppointmentCalendarSync } from "@/lib/calendar/calendar-sync-service";
import { generateDaySlots } from "@/lib/availability/slot-grid";
import {
  loadBlocksForDay,
  resolveWindowsForProviderDay,
} from "@/lib/availability/provider-availability-service";
import {
  civilDateISO,
  dayRangeInAppTz,
  formatDateTimeBR,
  zonedDateTimeToUtc,
} from "@/lib/timezone";
import { buildTemplateBody } from "@/lib/message";
import { queueMessage } from "@/lib/message-service";

/** Status em que o beneficiário ainda pode cancelar/reagendar (futuros). */
const BENEFICIARY_MANAGEABLE_STATUSES = new Set(["AGENDADO", "CONFIRMADO"]);

async function queueAppointmentConfirmationMessage(input: {
  tenantId: string;
  patientId: string;
  scheduledAt: Date;
  createdBy: string;
}) {
  const prisma = await getPrisma();
  const patient = await prisma.patient.findFirst({
    where: { id: input.patientId, tenantId: input.tenantId },
    select: { name: true },
  });
  if (!patient) return;

  const { subject, body } = buildTemplateBody({
    template: "APPOINTMENT_CONFIRMATION",
    patientName: patient.name,
    appointmentDateLabel: formatDateTimeBR(input.scheduledAt),
  });

  await queueMessage({
    tenantId: input.tenantId,
    patientId: input.patientId,
    channel: "EMAIL",
    template: "APPOINTMENT_CONFIRMATION",
    subject,
    body,
    createdBy: input.createdBy,
  });
}

export type AppointmentSlot = {
  start: string;
  label: string;
};

export type AppointmentSlotWithProvider = AppointmentSlot & {
  providerId: string;
  providerName: string;
};

/** Weekday JS (0=Dom…6=Sáb) a partir de YYYY-MM-DD civil — independente do fuso do host. */
function weekdayFromCivilISO(dateISO: string): number {
  const [year, month, day] = dateISO.split("-").map(Number);
  // Meio-dia UTC evita bordas; weekday civil BRT = mesmo dia na prática para datas ISO.
  return new Date(Date.UTC(year!, month! - 1, day!, 12, 0, 0)).getUTCDay();
}

/**
 * Slots livres do prestador no dia (fuso America/Sao_Paulo).
 * Usa a grade semanal publicada; se ainda não configurou, fallback 08:00–18:00 / 30 min.
 * Exclui agendamentos ativos e bloqueios pontuais.
 */
export async function getAvailableSlots(input: {
  tenantId: string;
  providerId: string;
  date: Date;
  /** Ignora o próprio agendamento ao reagendar (libera o slot atual). */
  excludeAppointmentId?: string;
}): Promise<{ slots: AppointmentSlot[]; usingDefault: boolean }> {
  const prisma = await getPrisma();
  const dateISO = civilDateISO(input.date);
  const { from: dayStart, to: dayEnd } = dayRangeInAppTz(dateISO);
  const weekday = weekdayFromCivilISO(dateISO);
  const [year, month, day] = dateISO.split("-").map(Number) as [number, number, number];

  const { windows, usingDefault } = await resolveWindowsForProviderDay({
    tenantId: input.tenantId,
    providerId: input.providerId,
    weekday,
  });

  if (windows.length === 0) {
    return { slots: [], usingDefault };
  }

  const [booked, blocks] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        tenantId: input.tenantId,
        providerId: input.providerId,
        scheduledAt: { gte: dayStart, lte: dayEnd },
        status: { notIn: ["CANCELADO", "FALTOU"] },
        ...(input.excludeAppointmentId ? { id: { not: input.excludeAppointmentId } } : {}),
      },
      select: { scheduledAt: true },
    }),
    loadBlocksForDay({
      tenantId: input.tenantId,
      providerId: input.providerId,
      dayStart,
      dayEnd,
    }),
  ]);

  const bookedSet = new Set(booked.map((b) => b.scheduledAt.getTime()));
  const generated = generateDaySlots({
    date: { year, month, day },
    windows,
    blocks,
    bookedStartMs: bookedSet,
    toUtc: ({ year: y, month: m, day: d, hour, minute }) =>
      zonedDateTimeToUtc({ year: y, month: m, day: d, hour, minute }),
  });

  return {
    usingDefault,
    slots: generated.map((s) => ({
      start: s.start.toISOString(),
      label: formatDateTimeBR(s.start, { year: undefined }),
    })),
  };
}

/** Slots livres de todos os prestadores em uma data (para quem não tem preferência). */
export async function getAvailableSlotsAcrossProviders(input: {
  tenantId: string;
  date: Date;
}): Promise<{ slots: AppointmentSlotWithProvider[] }> {
  const prisma = await getPrisma();
  const providers = await prisma.user.findMany({
    where: { tenantId: input.tenantId, role: "PRESTADOR" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const slots: AppointmentSlotWithProvider[] = [];
  for (const provider of providers) {
    const { slots: providerSlots } = await getAvailableSlots({
      tenantId: input.tenantId,
      providerId: provider.id,
      date: input.date,
    });
    for (const slot of providerSlots) {
      slots.push({
        ...slot,
        providerId: provider.id,
        providerName: provider.name,
        label: `${slot.label} — ${provider.name}`,
      });
    }
  }

  slots.sort((a, b) => a.start.localeCompare(b.start));
  return { slots };
}

/** Primeiro prestador livre no horário exato (atribuição automática). */
export async function findAvailableProviderAt(input: {
  tenantId: string;
  scheduledAt: Date;
  preferredProviderId?: string;
}): Promise<{ id: string; name: string } | null> {
  const prisma = await getPrisma();
  const providers = await prisma.user.findMany({
    where: { tenantId: input.tenantId, role: "PRESTADOR" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const ordered = input.preferredProviderId
    ? [
        ...providers.filter((p) => p.id === input.preferredProviderId),
        ...providers.filter((p) => p.id !== input.preferredProviderId),
      ]
    : providers;

  for (const provider of ordered) {
    const { slots } = await getAvailableSlots({
      tenantId: input.tenantId,
      providerId: provider.id,
      date: input.scheduledAt,
    });
    if (slots.some((s) => s.start === input.scheduledAt.toISOString())) {
      return provider;
    }
  }

  return null;
}

export async function bookBeneficiaryAppointment(input: {
  tenantId: string;
  patientId: string;
  petId?: string | null;
  providerId?: string;
  procedureId?: string;
  scheduledAt: Date;
  reason?: string | null;
  modality?: string;
  autoAssignProvider?: boolean;
  createdBy: string;
}) {
  let providerId = input.providerId;

  if (!providerId) {
    if (!input.autoAssignProvider) {
      return { error: "Informe o prestador ou escolha sem preferência" as const };
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

  const { slots } = await getAvailableSlots({
    tenantId: input.tenantId,
    providerId,
    date: input.scheduledAt,
  });

  const available = slots.some((s) => s.start === input.scheduledAt.toISOString());
  if (!available) {
    return { error: "Horário não disponível" as const };
  }

  /** Self-service: confirma automaticamente (sem recepção) e enfileira notificação. */
  const created = await createAppointment({
    tenantId: input.tenantId,
    patientId: input.patientId,
    petId: input.petId,
    providerId,
    procedureId: input.procedureId,
    scheduledAt: input.scheduledAt,
    reason: input.reason,
    modality: input.modality,
    status: "CONFIRMADO",
    createdBy: input.createdBy,
  });

  if ("error" in created) return created;

  await queueAppointmentConfirmationMessage({
    tenantId: input.tenantId,
    patientId: input.patientId,
    scheduledAt: input.scheduledAt,
    createdBy: input.createdBy,
  });

  return created;
}

/** Cancela consulta self-service — somente AGENDADO e futura. */
export async function cancelBeneficiaryAppointment(input: {
  tenantId: string;
  patientId: string;
  appointmentId: string;
  createdBy: string;
}) {
  const prisma = await getPrisma();
  const appointment = await prisma.appointment.findFirst({
    where: {
      id: input.appointmentId,
      tenantId: input.tenantId,
      patientId: input.patientId,
    },
    include: { patient: { select: { name: true } } },
  });

  if (!appointment) {
    return { error: "Agendamento não encontrado" as const };
  }

  if (!BENEFICIARY_MANAGEABLE_STATUSES.has(appointment.status)) {
    return { error: "Somente consultas futuras (agendadas ou confirmadas) podem ser canceladas" as const };
  }

  if (appointment.scheduledAt.getTime() <= Date.now()) {
    return { error: "Não é possível cancelar consultas passadas ou em andamento" as const };
  }

  await prisma.appointment.update({
    where: { id: appointment.id },
    data: { status: "CANCELADO" },
  });

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.APPOINTMENT,
    entityId: appointment.id,
    action: TIMELINE_ACTIONS.CANCELLED,
    description: `${appointment.patient.name} cancelou consulta agendada`,
    createdBy: input.createdBy,
    reversible: false,
  });

  void dispatchWebhooks({
    tenantId: input.tenantId,
    event: "APPOINTMENT_CANCELLED",
    data: {
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      providerId: appointment.providerId,
      status: "CANCELADO",
      previousStatus: appointment.status,
      modality: appointment.modality,
      telemedicineUrl: appointment.telemedicineUrl,
      scheduledAt: appointment.scheduledAt.toISOString(),
    },
  });

  queueAppointmentCalendarSync(appointment.id);

  return { ok: true as const, status: "CANCELADO" as const };
}

/**
 * Reagenda consulta self-service — mantém o mesmo registro (sem cancelar + criar).
 * Somente AGENDADO e futuro; valida slot livre excluindo o próprio agendamento.
 */
export async function rescheduleBeneficiaryAppointment(input: {
  tenantId: string;
  patientId: string;
  appointmentId: string;
  scheduledAt: Date;
  providerId?: string | null;
  createdBy: string;
}) {
  const prisma = await getPrisma();
  const appointment = await prisma.appointment.findFirst({
    where: {
      id: input.appointmentId,
      tenantId: input.tenantId,
      patientId: input.patientId,
    },
    include: { patient: { select: { name: true } } },
  });

  if (!appointment) {
    return { error: "Agendamento não encontrado" as const };
  }

  if (!BENEFICIARY_MANAGEABLE_STATUSES.has(appointment.status)) {
    return { error: "Somente consultas futuras (agendadas ou confirmadas) podem ser reagendadas" as const };
  }

  if (appointment.scheduledAt.getTime() <= Date.now()) {
    return { error: "Não é possível reagendar consultas passadas ou em andamento" as const };
  }

  if (Number.isNaN(input.scheduledAt.getTime())) {
    return { error: "Horário inválido" as const };
  }

  if (input.scheduledAt.getTime() <= Date.now()) {
    return { error: "Escolha um horário futuro" as const };
  }

  const providerId = input.providerId || appointment.providerId;
  if (!providerId) {
    return { error: "Prestador não definido para reagendamento" as const };
  }

  const { slots } = await getAvailableSlots({
    tenantId: input.tenantId,
    providerId,
    date: input.scheduledAt,
    excludeAppointmentId: appointment.id,
  });

  const available = slots.some((s) => s.start === input.scheduledAt.toISOString());
  if (!available) {
    return { error: "Horário não disponível" as const };
  }

  const previousScheduledAt = appointment.scheduledAt;

  await prisma.appointment.update({
    where: { id: appointment.id },
    data: {
      scheduledAt: input.scheduledAt,
      providerId,
    },
  });

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.APPOINTMENT,
    entityId: appointment.id,
    action: TIMELINE_ACTIONS.RESCHEDULED,
    description: `${appointment.patient.name} reagendou consulta de ${formatDateTimeBR(previousScheduledAt)} para ${formatDateTimeBR(input.scheduledAt)}`,
    createdBy: input.createdBy,
    reversible: false,
  });

  void dispatchWebhooks({
    tenantId: input.tenantId,
    event: "APPOINTMENT_UPDATED",
    data: {
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      providerId,
      status: appointment.status,
      modality: appointment.modality,
      telemedicineUrl: appointment.telemedicineUrl,
      scheduledAt: input.scheduledAt.toISOString(),
      previousScheduledAt: previousScheduledAt.toISOString(),
    },
  });

  queueAppointmentCalendarSync(appointment.id);

  return {
    ok: true as const,
    status: "AGENDADO" as const,
    scheduledAt: input.scheduledAt.toISOString(),
  };
}
