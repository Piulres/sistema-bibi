import "server-only";
import { getPrisma } from "@/lib/db";
import { formatBRL } from "@/lib/pricing";
import { bootstrapCommunicationGateway } from "@/lib/communications/bootstrap";
import { buildTemplateBody } from "@/lib/message";
import { dispatchMessage, queueMessage } from "@/lib/message-service";

bootstrapCommunicationGateway();

const MS_DAY = 24 * 60 * 60 * 1000;

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

export type ReminderEnqueueResult = {
  appointments: number;
  subscriptionCharges: number;
  invoiceDue: number;
  dispatched: number;
  errors: string[];
};

/**
 * Enfileira lembretes automáticos:
 * - consultas nas próximas 24h
 * - cobranças de assinatura com vencimento em até 3 dias
 * - procedimentos Pay Per Use ainda não faturados (fatura pendente)
 */
export async function enqueueDueReminders(input: {
  tenantId: string;
  createdBy: string;
  autoDispatch?: boolean;
}): Promise<ReminderEnqueueResult> {
  const prisma = await getPrisma();
  const now = new Date();
  const tomorrowEnd = new Date(now.getTime() + MS_DAY);
  const chargeHorizon = new Date(now.getTime() + 3 * MS_DAY);

  const result: ReminderEnqueueResult = {
    appointments: 0,
    subscriptionCharges: 0,
    invoiceDue: 0,
    dispatched: 0,
    errors: [],
  };

  const appointments = await prisma.appointment.findMany({
    where: {
      tenantId: input.tenantId,
      status: { in: ["AGENDADO", "CONFIRMADO"] },
      scheduledAt: { gte: now, lte: tomorrowEnd },
    },
    include: {
      patient: true,
      provider: { select: { name: true } },
    },
  });

  for (const appointment of appointments) {
    const existing = await prisma.message.findFirst({
      where: {
        tenantId: input.tenantId,
        patientId: appointment.patientId,
        template: "APPOINTMENT_REMINDER",
        status: { in: ["PENDENTE", "ENVIADA"] },
        createdAt: { gte: startOfDay(now) },
      },
    });
    if (existing) continue;

    const { subject, body } = buildTemplateBody({
      template: "APPOINTMENT_REMINDER",
      patientName: appointment.patient.name,
      appointmentDateLabel: appointment.scheduledAt.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
    });

    const queued = await queueMessage({
      tenantId: input.tenantId,
      patientId: appointment.patientId,
      channel: appointment.patient.phone ? "WHATSAPP" : "EMAIL",
      template: "APPOINTMENT_REMINDER",
      subject,
      body,
      createdBy: input.createdBy,
    });

    if (queued) {
      result.appointments += 1;
      if (input.autoDispatch) {
        const dispatch = await dispatchMessage({
          tenantId: input.tenantId,
          messageId: queued.id,
          createdBy: input.createdBy,
        });
        if ("message" in (dispatch ?? {})) result.dispatched += 1;
        else if (dispatch && "error" in dispatch && dispatch.error)
          result.errors.push(dispatch.error);
      }
    }
  }

  const charges = await prisma.subscriptionCharge.findMany({
    where: {
      status: "PENDENTE",
      dueDate: { gte: startOfDay(now), lte: endOfDay(chargeHorizon) },
      subscription: { tenantId: input.tenantId, status: "ATIVA" },
    },
    include: {
      subscription: { include: { patient: true } },
    },
  });

  for (const charge of charges) {
    const existing = await prisma.message.findFirst({
      where: {
        tenantId: input.tenantId,
        patientId: charge.subscription.patientId,
        template: "SUBSCRIPTION_DUE",
        status: { in: ["PENDENTE", "ENVIADA"] },
        createdAt: { gte: startOfDay(charge.dueDate) },
      },
    });
    if (existing) continue;

    const { subject, body } = buildTemplateBody({
      template: "SUBSCRIPTION_DUE",
      patientName: charge.subscription.patient.name,
      amountLabel: formatBRL(charge.amount),
    });

    const queued = await queueMessage({
      tenantId: input.tenantId,
      patientId: charge.subscription.patientId,
      channel: "EMAIL",
      template: "SUBSCRIPTION_DUE",
      subject,
      body,
      createdBy: input.createdBy,
    });

    if (queued) {
      result.subscriptionCharges += 1;
      if (input.autoDispatch) {
        const dispatch = await dispatchMessage({
          tenantId: input.tenantId,
          messageId: queued.id,
          createdBy: input.createdBy,
        });
        if ("message" in (dispatch ?? {})) result.dispatched += 1;
        else if (dispatch && "error" in dispatch && dispatch.error)
          result.errors.push(dispatch.error);
      }
    }
  }

  const pendingUsages = await prisma.procedureUsage.findMany({
    where: {
      billed: false,
      appointment: { tenantId: input.tenantId },
    },
    include: {
      procedure: true,
      appointment: { include: { patient: true } },
    },
  });

  const byPatient = new Map<string, { patientId: string; total: number; patientName: string }>();
  for (const usage of pendingUsages) {
    const patient = usage.appointment.patient;
    const entry = byPatient.get(patient.id) ?? {
      patientId: patient.id,
      total: 0,
      patientName: patient.name,
    };
    entry.total += usage.priceCharged;
    byPatient.set(patient.id, entry);
  }

  for (const entry of byPatient.values()) {
    const existing = await prisma.message.findFirst({
      where: {
        tenantId: input.tenantId,
        patientId: entry.patientId,
        template: "INVOICE_DUE",
        status: { in: ["PENDENTE", "ENVIADA"] },
        createdAt: { gte: startOfDay(now) },
      },
    });
    if (existing) continue;

    const { subject, body } = buildTemplateBody({
      template: "INVOICE_DUE",
      patientName: entry.patientName,
      amountLabel: formatBRL(entry.total),
    });

    const queued = await queueMessage({
      tenantId: input.tenantId,
      patientId: entry.patientId,
      channel: "EMAIL",
      template: "INVOICE_DUE",
      subject,
      body,
      createdBy: input.createdBy,
    });

    if (queued) {
      result.invoiceDue += 1;
      if (input.autoDispatch) {
        const dispatch = await dispatchMessage({
          tenantId: input.tenantId,
          messageId: queued.id,
          createdBy: input.createdBy,
        });
        if ("message" in (dispatch ?? {})) result.dispatched += 1;
        else if (dispatch && "error" in dispatch && dispatch.error)
          result.errors.push(dispatch.error);
      }
    }
  }

  return result;
}
