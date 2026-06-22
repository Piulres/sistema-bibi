import type { PrismaClient } from "@prisma/client";
import { TIMELINE_ACTIONS, TIMELINE_ENTITY_TYPES } from "../../src/lib/timeline";
import { monthsAgo } from "./helpers";
import type { PatientRef } from "./scenarios";

/**
 * Baseline de receita mensal determinística (6 meses).
 * Faturas consolidadas com totais fixos — relatórios comparáveis entre execuções.
 */
export async function seedMonthlyRevenueBaseline(input: {
  prisma: PrismaClient;
  tenantId: string;
  internoId: string;
  patients: PatientRef[];
}): Promise<{ months: number; totalRevenue: number }> {
  /** Totais fixos por mês (R$) — série ascendente para gráficos de tendência */
  const monthlyTotals = [28_400, 31_200, 29_800, 34_500, 36_100, 38_900];

  const corporatePatients = input.patients.filter((p) => p.companyId);
  if (corporatePatients.length === 0) return { months: 0, totalRevenue: 0 };

  let totalRevenue = 0;

  for (let m = 0; m < monthlyTotals.length; m++) {
    const monthDate = monthsAgo(monthlyTotals.length - m, 10);
    const target = monthlyTotals[m]!;
    const anchorPatient = corporatePatients[m % corporatePatients.length]!;

    const invoice = await input.prisma.invoice.create({
      data: {
        tenantId: input.tenantId,
        patientId: anchorPatient.id,
        companyId: anchorPatient.companyId,
        total: target,
        status: m < 4 ? "PAGA" : "FECHADA",
        createdAt: monthDate,
        items: {
          create: [
            {
              description: `Faturamento corporativo consolidado — mês ${m + 1}/6`,
              amount: Math.round(target * 0.62 * 100) / 100,
            },
            {
              description: `Procedimentos Pay Per Use — mês ${m + 1}/6`,
              amount: Math.round(target * 0.38 * 100) / 100,
            },
          ],
        },
      },
    });

    totalRevenue += target;

    await input.prisma.timelineEvent.create({
      data: {
        tenantId: input.tenantId,
        entityType: TIMELINE_ENTITY_TYPES.INVOICE,
        entityId: invoice.id,
        action: TIMELINE_ACTIONS.INVOICE_ISSUED,
        description: `Baseline mensal M-${m + 1} — R$ ${target.toFixed(2)}`,
        createdBy: input.internoId,
        createdAt: monthDate,
      },
    });

    if (m < 4) {
      await input.prisma.payment.create({
        data: {
          invoiceId: invoice.id,
          method: "PIX",
          amount: target,
          status: "CONFIRMED",
          gatewayId: "mock",
          externalId: `baseline-m${m}-${invoice.id.slice(-6)}`,
          pixCopyPaste: `00020126580014br.gov.bcb.pix0136baseline-m${m}`,
          paidAt: new Date(monthDate.getTime() + 3 * 24 * 60 * 60 * 1000),
          createdBy: input.internoId,
        },
      });

      await input.prisma.timelineEvent.create({
        data: {
          tenantId: input.tenantId,
          entityType: TIMELINE_ENTITY_TYPES.INVOICE,
          entityId: invoice.id,
          action: TIMELINE_ACTIONS.INVOICE_PAID,
          description: `Baseline mensal M-${m + 1} pago via PIX`,
          createdBy: input.internoId,
          createdAt: new Date(monthDate.getTime() + 3 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  return { months: monthlyTotals.length, totalRevenue };
}
