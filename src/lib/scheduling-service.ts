import "server-only";
import { prisma } from "@/lib/db";
import { createAppointment } from "@/lib/appointment-service";

/** Horário comercial simplificado para slots (POC). */
const SLOT_START_HOUR = 8;
const SLOT_END_HOUR = 18;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Gera slots de 30min entre 8h e 18h excluindo horários já ocupados. */
export async function getAvailableSlots(input: {
  tenantId: string;
  providerId: string;
  date: Date;
}): Promise<{ slots: { start: string; label: string }[] }> {
  const dayStart = startOfDay(input.date);
  const dayEnd = endOfDay(input.date);

  const booked = await prisma.appointment.findMany({
    where: {
      tenantId: input.tenantId,
      providerId: input.providerId,
      scheduledAt: { gte: dayStart, lte: dayEnd },
      status: { notIn: ["CANCELADO", "FALTOU"] },
    },
    select: { scheduledAt: true },
  });

  const bookedSet = new Set(booked.map((b) => b.scheduledAt.getTime()));
  const slots: { start: string; label: string }[] = [];
  const now = Date.now();

  for (let hour = SLOT_START_HOUR; hour < SLOT_END_HOUR; hour++) {
    for (const minute of [0, 30]) {
      const slot = new Date(dayStart);
      slot.setHours(hour, minute, 0, 0);
      if (slot.getTime() < now) continue;
      if (bookedSet.has(slot.getTime())) continue;

      slots.push({
        start: slot.toISOString(),
        label: slot.toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    }
  }

  return { slots };
}

export async function bookBeneficiaryAppointment(input: {
  tenantId: string;
  patientId: string;
  providerId: string;
  scheduledAt: Date;
  reason?: string | null;
  createdBy: string;
}) {
  const slotDate = startOfDay(input.scheduledAt);
  const { slots } = await getAvailableSlots({
    tenantId: input.tenantId,
    providerId: input.providerId,
    date: slotDate,
  });

  const available = slots.some((s) => s.start === input.scheduledAt.toISOString());
  if (!available) {
    return { error: "Horário não disponível" as const };
  }

  return createAppointment({
    tenantId: input.tenantId,
    patientId: input.patientId,
    providerId: input.providerId,
    scheduledAt: input.scheduledAt,
    reason: input.reason,
    status: "AGENDADO",
    createdBy: input.createdBy,
  });
}
