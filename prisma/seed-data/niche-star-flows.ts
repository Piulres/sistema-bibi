import type { PrismaClient } from "@prisma/client";
import {
  TIMELINE_ACTIONS,
  TIMELINE_ENTITY_TYPES,
} from "../../src/lib/timeline";
import type { NicheOperationalConfig } from "./niche-catalogs";
import { NICHE_BENEFIT_PRODUCTS } from "./niche-catalogs";
import type { ProcedureRef } from "./scenarios";
import { formatBrl } from "./pricing-market";
import { daysAgo, firstDayOfMonthFromNow, todayAt } from "./helpers";

export type StarPatientRef = {
  patientId: string;
  name: string;
  email: string;
  companyId: string | null;
};

const STAR_PROC_CODES: Record<string, [string, string]> = {
  VET: ["VET-CON", "VET-EX-HMG"],
  DENTAL: ["DEN-CON", "DEN-RX"],
  LEGAL: ["LEG-CON", "LEG-HT"],
  SPA: ["SPA-MSG", "SPA-PAC"],
  EDUCATION: ["EDU-AUL", "EDU-CERT"],
};

/**
 * Fluxos demo estrela (3 personas) por nicho — espelha João/Maria/Pedro do Horizonte.
 * 1) PPU pendente hoje · 2) Fatura + PIX pendente · 3) Particular com fatura paga + assinatura suspensa
 */
export async function seedNicheStarFlows(input: {
  prisma: PrismaClient;
  tenantId: string;
  config: NicheOperationalConfig;
  procedures: Record<string, ProcedureRef>;
  providerId: string;
  internoId: string;
  stars: StarPatientRef[];
}): Promise<void> {
  if (input.stars.length < 2) return;

  const codes = STAR_PROC_CODES[input.config.niche] ?? [
    input.config.procedures[0]?.code ?? "SVC-01",
    input.config.procedures[1]?.code ?? "SVC-02",
  ];
  const procPrimary = input.procedures[codes[0]!];
  const procSecondary = input.procedures[codes[1]!];
  if (!procPrimary) return;

  const star1 = input.stars[0]!;
  const star2 = input.stars[1]!;
  const star3 = input.stars[2];

  const ag1 = await input.prisma.appointment.create({
    data: {
      scheduledAt: todayAt(9, 30),
      status: "CONFIRMADO",
      reason: input.config.appointmentReasons[0] ?? "Atendimento demo",
      tenantId: input.tenantId,
      patientId: star1.patientId,
      providerId: input.providerId,
    },
  });

  const usage1 = await input.prisma.procedureUsage.create({
    data: {
      appointmentId: ag1.id,
      procedureId: procPrimary.id,
      priceCharged: procPrimary.basePrice,
    },
  });
  await input.prisma.timelineEvent.create({
    data: {
      tenantId: input.tenantId,
      entityType: TIMELINE_ENTITY_TYPES.PROCEDURE_USAGE,
      entityId: usage1.id,
      action: TIMELINE_ACTIONS.PROCEDURE_REGISTERED,
      description: `${procPrimary.name} registrado para ${star1.name} (${formatBrl(procPrimary.basePrice)})`,
      createdBy: input.providerId,
    },
  });

  if (procSecondary && star2.companyId) {
    const ag2 = await input.prisma.appointment.create({
      data: {
        scheduledAt: todayAt(11, 0),
        status: "AGENDADO",
        modality: input.config.telemedicineRatio > 0.4 ? "TELE" : "PRESENCIAL",
        telemedicineUrl:
          input.config.telemedicineRatio > 0.4
            ? `https://meet.bibi.health/room/${input.config.slug}-tele`
            : null,
        reason: input.config.appointmentReasons[1] ?? "Retorno demo",
        tenantId: input.tenantId,
        patientId: star2.patientId,
        providerId: input.providerId,
      },
    });

    const usage2 = await input.prisma.procedureUsage.create({
      data: {
        appointmentId: ag2.id,
        procedureId: procSecondary.id,
        priceCharged: procSecondary.basePrice,
      },
    });

    const inv = await input.prisma.invoice.create({
      data: {
        tenantId: input.tenantId,
        patientId: star2.patientId,
        companyId: star2.companyId,
        total: procSecondary.basePrice,
        status: "FECHADA",
        items: {
          create: [
            {
              description: procSecondary.name,
              amount: procSecondary.basePrice,
              usageId: usage2.id,
            },
          ],
        },
      },
    });
    await input.prisma.procedureUsage.update({
      where: { id: usage2.id },
      data: { billed: true },
    });
    await input.prisma.payment.create({
      data: {
        invoiceId: inv.id,
        method: "PIX",
        amount: procSecondary.basePrice,
        status: "PENDING",
        gatewayId: "mock",
        externalId: `seed-pix-${input.config.slug}-${inv.id.slice(-8)}`,
        pixCopyPaste: `00020126580014br.gov.bcb.pix0136${input.config.slug}-${inv.id.slice(-12)}`,
        createdBy: input.internoId,
      },
    });
  }

  if (star3 && procPrimary) {
    const agPast = await input.prisma.appointment.create({
      data: {
        scheduledAt: daysAgo(21),
        status: "REALIZADO",
        reason: input.config.appointmentReasons[2] ?? "Atendimento particular",
        tenantId: input.tenantId,
        patientId: star3.patientId,
        providerId: input.providerId,
      },
    });
    const usage3 = await input.prisma.procedureUsage.create({
      data: {
        appointmentId: agPast.id,
        procedureId: procPrimary.id,
        priceCharged: procPrimary.basePrice,
        billed: true,
      },
    });
    const invPaid = await input.prisma.invoice.create({
      data: {
        tenantId: input.tenantId,
        patientId: star3.patientId,
        companyId: null,
        total: procPrimary.basePrice,
        status: "PAGA",
        items: {
          create: [
            {
              description: procPrimary.name,
              amount: procPrimary.basePrice,
              usageId: usage3.id,
            },
          ],
        },
      },
    });
    await input.prisma.payment.create({
      data: {
        invoiceId: invPaid.id,
        method: "PIX",
        amount: procPrimary.basePrice,
        status: "CONFIRMED",
        gatewayId: "mock",
        externalId: `seed-paid-${input.config.slug}`,
        paidAt: daysAgo(19),
        createdBy: input.internoId,
      },
    });

    const benefits = NICHE_BENEFIT_PRODUCTS[input.config.niche as keyof typeof NICHE_BENEFIT_PRODUCTS];
    const product = Object.values(benefits)[0];
    if (product) {
      await input.prisma.subscription.create({
        data: {
          tenantId: input.tenantId,
          patientId: star3.patientId,
          companyId: null,
          status: "SUSPENSA",
          billingCycle: product.billingCycle,
          startDate: daysAgo(180),
          amount: product.amount,
          description: `${product.description} — suspenso (demo)`,
        },
      });
    }
  }

  const benefits = NICHE_BENEFIT_PRODUCTS[input.config.niche as keyof typeof NICHE_BENEFIT_PRODUCTS];
  const activeProduct = Object.values(benefits)[0];
  if (benefits && activeProduct && star1.companyId) {
    const sub = await input.prisma.subscription.create({
      data: {
        tenantId: input.tenantId,
        patientId: star1.patientId,
        companyId: star1.companyId,
        status: "ATIVA",
        billingCycle: activeProduct.billingCycle,
        startDate: new Date("2025-01-01"),
        amount: activeProduct.amount,
        description: `${activeProduct.description} — ${input.config.slug}`,
      },
    });
    await input.prisma.subscriptionCharge.create({
      data: {
        subscriptionId: sub.id,
        dueDate: firstDayOfMonthFromNow(1),
        amount: activeProduct.amount,
        status: "PENDENTE",
      },
    });
  }

  await input.prisma.message.createMany({
    data: [
      {
        tenantId: input.tenantId,
        patientId: star1.patientId,
        channel: "WHATSAPP",
        template: "APPOINTMENT_REMINDER",
        body: `Olá ${star1.name}, lembramos seu atendimento hoje. Confirme sua presença.`,
        status: "PENDENTE",
        createdBy: input.internoId,
      },
      {
        tenantId: input.tenantId,
        patientId: star2.patientId,
        channel: "EMAIL",
        template: "SUBSCRIPTION_DUE",
        subject: `Cobrança — ${input.config.slug}`,
        body: `Olá ${star2.name}, há uma cobrança pendente no portal. Regularize para manter o benefício.`,
        status: "PENDENTE",
        createdBy: input.internoId,
      },
    ],
  });
}
