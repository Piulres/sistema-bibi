import type { PrismaClient } from "@prisma/client";
import {
  TIMELINE_ACTIONS,
  TIMELINE_ENTITY_TYPES,
} from "../../src/lib/timeline";
import type { SeedCompany } from "./companies";
import type { ScaleConfig } from "./scale";
import {
  APPOINTMENT_REASONS,
  BILLING_CYCLES,
  MEDICAL_RECORD_SNIPPETS,
} from "./catalog";
import {
  daysAgo,
  daysFromNow,
  firstDayOfMonthFromNow,
  monthsAgo,
  pick,
  todayAt,
} from "./helpers";

export type ProcedureRef = { id: string; basePrice: number; name: string; code: string };

export type PatientRef = {
  id: string;
  name: string;
  companyId: string | null;
  companyIndex: number;
};

export type SeedMassContext = {
  prisma: PrismaClient;
  tenantId: string;
  procedures: Record<string, ProcedureRef>;
  providerIds: string[];
  internoId: string;
  companyIdByIndex: Map<number, string>;
  discountByCompanyIndex: Map<number, number>;
  patients: PatientRef[];
  excludePatientIds: Set<string>;
  companies: SeedCompany[];
  scale: ScaleConfig;
};

export type SeedMassStats = {
  appointments: number;
  procedureUsages: number;
  medicalRecords: number;
  invoices: number;
  payments: number;
  subscriptions: number;
  subscriptionCharges: number;
  messages: number;
  timelineEvents: number;
  webhookDeliveries: number;
  beneficiaryUsers: number;
};

const PROCEDURE_CODES = [
  "CON-CLM", "CON-CAR", "CON-DER", "CON-PSI", "CON-OFT",
  "EXA-HEM", "EXA-ECG", "EXA-USG", "EXA-RX", "EXA-GLI", "EXA-COL",
] as const;

function priceFor(
  code: string,
  basePrice: number,
  companyIndex: number,
  discounts: Map<number, number>,
): number {
  if (code === "CON-CLM" && companyIndex > 0) {
    const m = discounts.get(companyIndex);
    if (m) return Math.round(basePrice * m * 100) / 100;
  }
  return basePrice;
}

function pickProvider(providerIds: string[], salt: number): string {
  return providerIds[salt % providerIds.length]!;
}

/** Massa operacional completa: agenda, PPU, faturas, recorrência, comunicação e integrações. */
export async function seedOperationalMass(ctx: SeedMassContext): Promise<SeedMassStats> {
  const stats: SeedMassStats = {
    appointments: 0,
    procedureUsages: 0,
    medicalRecords: 0,
    invoices: 0,
    payments: 0,
    subscriptions: 0,
    subscriptionCharges: 0,
    messages: 0,
    timelineEvents: 0,
    webhookDeliveries: 0,
    beneficiaryUsers: 0,
  };

  const bulkPatients = ctx.patients.filter((p) => !ctx.excludePatientIds.has(p.id));
  if (bulkPatients.length === 0) return stats;

  const appointmentTotal = ctx.scale.appointmentCount;
  const messageTotal = ctx.scale.messageCount;
  const historyDays = ctx.scale.historyDays;
  const chargeSpan = ctx.scale.subscriptionChargeSpan;
  const chargeMonthsPast = Math.floor(chargeSpan / 2);
  const chargeMonthsFuture = chargeSpan - chargeMonthsPast;

  const realizedAppointments: {
    id: string;
    patient: PatientRef;
    providerId: string;
    scheduledAt: Date;
  }[] = [];

  for (let i = 0; i < appointmentTotal; i++) {
    const patient = bulkPatients[i % bulkPatients.length]!;
    const providerId = pickProvider(ctx.providerIds, i);

    let scheduledAt: Date;
    let status: "AGENDADO" | "CONFIRMADO" | "REALIZADO" | "FALTOU" | "CANCELADO";

    if (i < Math.min(12, Math.round(appointmentTotal * 0.1))) {
      scheduledAt = todayAt(7 + (i % 10), (i * 12) % 60);
      status = i % 4 === 0 ? "CONFIRMADO" : "AGENDADO";
    } else if (i < Math.min(20, Math.round(appointmentTotal * 0.15))) {
      scheduledAt = daysFromNow(1 + (i % 14), 8 + (i % 8));
      status = "AGENDADO";
    } else {
      const daysBack = 2 + (i % Math.max(historyDays - 2, 30));
      scheduledAt = daysAgo(daysBack, 8 + (i % 9), (i * 7) % 60);
      const roll = i % 10;
      if (roll < 6) status = "REALIZADO";
      else if (roll < 8) status = "FALTOU";
      else status = "CANCELADO";
    }

    const isTele = i % 6 === 0;
    const appointment = await ctx.prisma.appointment.create({
      data: {
        scheduledAt,
        status,
        modality: isTele ? "TELE" : "PRESENCIAL",
        telemedicineUrl: isTele ? `https://meet.bibi.health/room/seed-${i}` : null,
        reason: pick(APPOINTMENT_REASONS, i),
        tenantId: ctx.tenantId,
        patientId: patient.id,
        providerId,
      },
    });
    stats.appointments += 1;

    if (status === "REALIZADO") {
      realizedAppointments.push({
        id: appointment.id,
        patient,
        providerId,
        scheduledAt,
      });
    }
  }

  const billedUsages: {
    usageId: string;
    patient: PatientRef;
    amount: number;
    description: string;
    performedAt: Date;
  }[] = [];

  for (let i = 0; i < realizedAppointments.length; i++) {
    const appt = realizedAppointments[i]!;
    const procCount = 1 + (i % 3);

    for (let j = 0; j < procCount; j++) {
      const code = PROCEDURE_CODES[(i + j) % PROCEDURE_CODES.length]!;
      const proc = ctx.procedures[code];
      if (!proc) continue;

      const charged = priceFor(
        code,
        proc.basePrice,
        appt.patient.companyIndex,
        ctx.discountByCompanyIndex,
      );
      const billed = (i + j) % 5 !== 0;

      const usage = await ctx.prisma.procedureUsage.create({
        data: {
          appointmentId: appt.id,
          procedureId: proc.id,
          priceCharged: charged,
          billed,
          performedAt: appt.scheduledAt,
        },
      });
      stats.procedureUsages += 1;

      if (billed) {
        billedUsages.push({
          usageId: usage.id,
          patient: appt.patient,
          amount: charged,
          description: proc.name,
          performedAt: appt.scheduledAt,
        });
      }
    }

    if (i % 2 === 0 || i % 5 === 0) {
      await ctx.prisma.medicalRecord.create({
        data: {
          recordType: i % 7 === 0 ? "ATESTADO" : "EVOLUCAO",
          title: i % 7 === 0 ? "Atestado médico" : null,
          content: pick(MEDICAL_RECORD_SNIPPETS, i),
          patientId: appt.patient.id,
          providerId: appt.providerId,
          appointmentId: appt.id,
          createdAt: appt.scheduledAt,
        },
      });
      stats.medicalRecords += 1;
    }
  }

  const invoicesByPatient = new Map<string, typeof billedUsages>();
  for (const item of billedUsages) {
    const list = invoicesByPatient.get(item.patient.id) ?? [];
    list.push(item);
    invoicesByPatient.set(item.patient.id, list);
  }

  let invoiceSeq = 0;
  for (const [patientId, items] of invoicesByPatient) {
    const patient = bulkPatients.find((p) => p.id === patientId);
    if (!patient || items.length === 0) continue;

    for (let offset = 0; offset < items.length; offset += 4) {
      const batch = items.slice(offset, offset + 4);
      const total = batch.reduce((s, x) => s + x.amount, 0);
      invoiceSeq += 1;

      const statusRoll = invoiceSeq % 10;
      const status = statusRoll < 5 ? "PAGA" : statusRoll < 8 ? "FECHADA" : "ABERTA";

      const invoice = await ctx.prisma.invoice.create({
        data: {
          tenantId: ctx.tenantId,
          patientId,
          companyId: patient.companyId,
          total,
          status,
          createdAt: batch[0]!.performedAt,
          items: {
            create: batch.map((b) => ({
              description: b.description,
              amount: b.amount,
              usageId: b.usageId,
            })),
          },
        },
      });
      stats.invoices += 1;

      await ctx.prisma.timelineEvent.create({
        data: {
          tenantId: ctx.tenantId,
          entityType: TIMELINE_ENTITY_TYPES.INVOICE,
          entityId: invoice.id,
          action: TIMELINE_ACTIONS.INVOICE_ISSUED,
          description: `Fatura Pay Per Use emitida para ${patient.name}`,
          createdBy: ctx.internoId,
          createdAt: batch[0]!.performedAt,
        },
      });
      stats.timelineEvents += 1;

      if (status === "PAGA") {
        await ctx.prisma.payment.create({
          data: {
            invoiceId: invoice.id,
            method: "PIX",
            amount: total,
            status: "CONFIRMED",
            gatewayId: "mock",
            externalId: `seed-pix-${invoice.id.slice(-8)}`,
            pixCopyPaste: `00020126580014br.gov.bcb.pix0136${invoice.id.slice(-12)}`,
            qrCodePayload: `PIX|${total}|${invoice.id}`,
            paidAt: new Date(batch[0]!.performedAt.getTime() + 2 * 24 * 60 * 60 * 1000),
            createdBy: ctx.internoId,
          },
        });
        stats.payments += 1;

        await ctx.prisma.timelineEvent.create({
          data: {
            tenantId: ctx.tenantId,
            entityType: TIMELINE_ENTITY_TYPES.INVOICE,
            entityId: invoice.id,
            action: TIMELINE_ACTIONS.INVOICE_PAID,
            description: `Pagamento PIX confirmado — ${patient.name}`,
            createdBy: ctx.internoId,
            createdAt: new Date(batch[0]!.performedAt.getTime() + 2 * 24 * 60 * 60 * 1000),
          },
        });
        stats.timelineEvents += 1;
      } else if (status === "FECHADA" && invoiceSeq % 3 === 0) {
        await ctx.prisma.payment.create({
          data: {
            invoiceId: invoice.id,
            method: "PIX",
            amount: total,
            status: "PENDING",
            gatewayId: "mock",
            externalId: `seed-pix-pending-${invoice.id.slice(-8)}`,
            pixCopyPaste: `00020126580014br.gov.bcb.pix0136pending-${invoice.id.slice(-10)}`,
            createdBy: ctx.internoId,
          },
        });
        stats.payments += 1;
      }
    }
  }

  const activeCompanies = ctx.companies.filter((c) => c.status === "ATIVO");

  for (const company of activeCompanies) {
    const companyId = ctx.companyIdByIndex.get(company.index);
    if (!companyId) continue;

    const companyPatients = bulkPatients.filter((p) => p.companyId === companyId);
    const withSub = companyPatients.filter((_, idx) => idx % 2 === 0 || company.index <= 5);

    for (let i = 0; i < withSub.length; i++) {
      const patient = withSub[i]!;
      const cycle = pick(BILLING_CYCLES, company.index + i);
      const amount =
        cycle === "MENSAL" ? 69.9 + (company.index % 5) * 10 :
        cycle === "TRIMESTRAL" ? 189.9 + (company.index % 4) * 20 :
        cycle === "SEMESTRAL" ? 349.9 :
        599.9;

      const subscription = await ctx.prisma.subscription.create({
        data: {
          tenantId: ctx.tenantId,
          patientId: patient.id,
          companyId,
          status: "ATIVA",
          billingCycle: cycle,
          startDate: monthsAgo(6 + (i % 4)),
          amount,
          description: `Plano corporativo ${company.name.split(" ")[0]} — ${company.sector}`,
        },
      });
      stats.subscriptions += 1;

      for (let m = -chargeMonthsPast; m < chargeMonthsFuture; m++) {
        const dueDate = firstDayOfMonthFromNow(m);
        const isPast = m < 0;
        const chargeStatus = isPast
          ? m % 2 === 0 ? "FATURADA" : "PENDENTE"
          : "PENDENTE";

        await ctx.prisma.subscriptionCharge.create({
          data: {
            subscriptionId: subscription.id,
            dueDate,
            amount,
            status: chargeStatus,
          },
        });
        stats.subscriptionCharges += 1;
      }
    }
  }

  const channels = ["EMAIL", "WHATSAPP", "SMS"] as const;
  const templates = ["APPOINTMENT_REMINDER", "INVOICE_DUE", "SUBSCRIPTION_DUE", "GENERIC"] as const;
  const msgStatuses = ["PENDENTE", "ENVIADA", "FALHA"] as const;

  for (let i = 0; i < messageTotal; i++) {
    const patient = bulkPatients[i % bulkPatients.length]!;
    const channel = channels[i % channels.length]!;
    const status = msgStatuses[i % msgStatuses.length]!;
    const template = templates[i % templates.length]!;

    const msg = await ctx.prisma.message.create({
      data: {
        tenantId: ctx.tenantId,
        patientId: patient.id,
        channel,
        template,
        subject: channel === "EMAIL" ? `Bibi Saúde — ${template}` : null,
        body: `Mensagem ${template} para ${patient.name} (seed massa #${i + 1}).`,
        status,
        sentAt: status === "ENVIADA" ? daysAgo(i % 10) : null,
        createdBy: ctx.internoId,
        createdAt: daysAgo(i % 30),
      },
    });
    stats.messages += 1;

    if (i % 8 === 0) {
      await ctx.prisma.timelineEvent.create({
        data: {
          tenantId: ctx.tenantId,
          entityType: TIMELINE_ENTITY_TYPES.MESSAGE,
          entityId: msg.id,
          action:
            status === "ENVIADA"
              ? TIMELINE_ACTIONS.MESSAGE_SENT
              : status === "FALHA"
                ? TIMELINE_ACTIONS.MESSAGE_FAILED
                : TIMELINE_ACTIONS.MESSAGE_QUEUED,
          description: `${channel} ${status.toLowerCase()} — ${patient.name}`,
          createdBy: ctx.internoId,
          createdAt: daysAgo(i % 30),
        },
      });
      stats.timelineEvents += 1;
    }
  }

  const sampleCompanies = activeCompanies.slice(0, 12);
  for (let i = 0; i < sampleCompanies.length; i++) {
    const company = sampleCompanies[i]!;
    const companyId = ctx.companyIdByIndex.get(company.index);
    if (!companyId) continue;

    await ctx.prisma.timelineEvent.create({
      data: {
        tenantId: ctx.tenantId,
        entityType: TIMELINE_ENTITY_TYPES.COMPANY,
        entityId: companyId,
        action: TIMELINE_ACTIONS.CONTRACT_CHANGED,
        description: `Contrato revisado — ${company.name} (${company.sector})`,
        createdBy: ctx.internoId,
        createdAt: daysAgo(i * 3 + 1),
      },
    });
    stats.timelineEvents += 1;
  }

  const webhook2 = await ctx.prisma.webhookEndpoint.create({
    data: {
      tenantId: ctx.tenantId,
      label: "ERP Seguros União (demo)",
      url: "https://webhook.site/demo-bibi-seguros",
      secret: "demo-webhook-secret-2",
      events: JSON.stringify(["PATIENT_CREATED", "INVOICE_ISSUED", "APPOINTMENT_CREATED"]),
    },
  });

  const deliverySpecs = [
    { status: "SUCCESS", httpStatus: 200, attempt: 1 },
    { status: "SUCCESS", httpStatus: 201, attempt: 1 },
    { status: "FAILED", httpStatus: 503, attempt: 3, errorMessage: "Service Unavailable" },
    { status: "PENDING", httpStatus: null, attempt: 2, nextRetry: true },
    { status: "FAILED", httpStatus: 500, attempt: 5, errorMessage: "Internal Server Error" },
  ] as const;

  for (let i = 0; i < deliverySpecs.length; i++) {
    const spec = deliverySpecs[i]!;
    await ctx.prisma.webhookDelivery.create({
      data: {
        tenantId: ctx.tenantId,
        webhookId: webhook2.id,
        event: i % 2 === 0 ? "INVOICE_ISSUED" : "APPOINTMENT_CREATED",
        payload: JSON.stringify({ demo: true, seq: i, tenantId: ctx.tenantId }),
        status: spec.status,
        httpStatus: spec.httpStatus,
        errorMessage: "errorMessage" in spec ? spec.errorMessage : null,
        attempt: spec.attempt,
        maxAttempts: 5,
        nextRetryAt: "nextRetry" in spec ? daysFromNow(1) : null,
        deliveredAt: spec.status === "SUCCESS" ? daysAgo(i + 1) : null,
        createdAt: daysAgo(i + 2),
      },
    });
    stats.webhookDeliveries += 1;
  }

  return stats;
}

/** Cria usuários do portal beneficiário para amostra representativa. */
export async function seedBeneficiaryPortalUsers(
  ctx: Pick<SeedMassContext, "prisma" | "tenantId" | "patients" | "excludePatientIds" | "scale"> & {
    password: string;
    extraEmails?: Map<string, string>;
  },
): Promise<number> {
  let count = 0;
  const candidates = ctx.patients.filter(
    (p) => !ctx.excludePatientIds.has(p.id) && p.companyId,
  );

  const limit = ctx.scale.beneficiaryPortalUsers;

  for (let i = 0; i < Math.min(limit, candidates.length); i++) {
    const patient = candidates[i * 7] ?? candidates[i];
    if (!patient) continue;

    const email =
      ctx.extraEmails?.get(patient.id) ??
      `beneficiario.${patient.name.split(" ")[0]!.toLowerCase()}${i}@empresa.demo`;

    const existing = await ctx.prisma.user.findUnique({ where: { email } });
    if (existing) continue;

    await ctx.prisma.user.create({
      data: {
        email,
        password: ctx.password,
        name: patient.name,
        role: "BENEFICIARIO",
        tenantId: ctx.tenantId,
        patientId: patient.id,
      },
    });
    count += 1;
  }

  return count;
}
