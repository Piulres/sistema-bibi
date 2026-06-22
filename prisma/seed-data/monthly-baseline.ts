import type { PrismaClient } from "@prisma/client";
import { TIMELINE_ACTIONS, TIMELINE_ENTITY_TYPES } from "../../src/lib/timeline";
import { monthsAgo } from "./helpers";
import type { PatientRef } from "./scenarios";
import type { SeedCompany } from "./companies";
import { estimateCompanyMonthlyPpu, formatBrl } from "./pricing-market";

/**
 * Fechamento mensal corporativo (6 meses) — totais derivados do perfil de cada empresa,
 * não valores fixos arbitrários. Reflete contratos B2B Pay Per Use típicos.
 */
export async function seedMonthlyRevenueBaseline(input: {
  prisma: PrismaClient;
  tenantId: string;
  internoId: string;
  patients: PatientRef[];
  companies: SeedCompany[];
  companyIdByIndex: Map<number, string>;
}): Promise<{ months: number; totalRevenue: number }> {
  const monthCount = 6;
  const activeCompanies = input.companies.filter((c) => c.status === "ATIVO" && c.beneficiaryCount > 0);
  if (activeCompanies.length === 0) return { months: 0, totalRevenue: 0 };

  let totalRevenue = 0;

  for (let m = 0; m < monthCount; m++) {
    const monthDate = monthsAgo(monthCount - m, 10);
    const growth = 1 + m * 0.03;

    for (const company of activeCompanies) {
      const companyId = input.companyIdByIndex.get(company.index);
      if (!companyId) continue;

      const companyPatients = input.patients.filter((p) => p.companyId === companyId);
      if (companyPatients.length === 0) continue;

      const base = estimateCompanyMonthlyPpu(company);
      const target = Math.round(base * growth * 100) / 100;
      if (target < 50) continue;

      const anchorPatient = companyPatients[m % companyPatients.length]!;
      const occupationalShare =
        company.sector === "Indústria" ||
        company.sector === "Construção Civil" ||
        company.sector === "Logística"
          ? 0.55
          : 0.18;
      const clinicalShare = 1 - occupationalShare;

      const invoice = await input.prisma.invoice.create({
        data: {
          tenantId: input.tenantId,
          patientId: anchorPatient.id,
          companyId,
          total: target,
          status: m < 4 ? "PAGA" : "FECHADA",
          createdAt: monthDate,
          items: {
            create: [
              {
                description: `Procedimentos clínicos Pay Per Use — ${company.sector}`,
                amount: Math.round(target * clinicalShare * 100) / 100,
              },
              {
                description: `Medicina do trabalho / PCMSO — ${company.name.split(" ")[0]}`,
                amount: Math.round(target * occupationalShare * 100) / 100,
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
          description: `Fechamento mensal ${company.name.split(" ")[0]} — ${formatBrl(target)}`,
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
            externalId: `corp-m${m}-${company.index}`,
            pixCopyPaste: `00020126580014br.gov.bcb.pix0136corp-${company.index}-m${m}`,
            paidAt: new Date(monthDate.getTime() + 5 * 24 * 60 * 60 * 1000),
            createdBy: input.internoId,
          },
        });
      }
    }
  }

  return { months: monthCount, totalRevenue };
}
