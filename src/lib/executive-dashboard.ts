import "server-only";
import {
  civilDateISO,
  endOfDayInAppTz,
  formatDateTimeBR as dateTime,
  startOfDayInAppTz,
} from "@/lib/timezone";
import { getPrisma } from "@/lib/db";
import { companyStatusLabel } from "@/lib/company-crm";
import { getClinicFinanceKpis } from "@/lib/clinic-finance/service";
import { summarizeInvoiceMoney } from "@/lib/executive-dashboard-kpis";
import { formatBRL } from "@/lib/pricing";
import { monthsForBillingCycle } from "@/lib/subscription";

function startOfToday(): Date {
  return startOfDayInAppTz();
}

function endOfToday(): Date {
  return endOfDayInAppTz();
}

/** Converte valor de assinatura para equivalente mensal (MRR). */
function monthlyEquivalent(amount: number, billingCycle: string): number {
  const months = monthsForBillingCycle(billingCycle);
  return amount / months;
}

export type ExecutiveDashboardData = {
  generatedAt: string;
  generatedAtLabel: string;
  kpis: {
    totalPatients: number;
    totalCompanies: number;
    appointmentsToday: number;
    /** Procedimentos PPU ainda sem fatura. */
    pendingBillingLabel: string;
    /**
     * Soma de faturas abertas + pagas (emitidas).
     * Preferir `toCollectLabel` / `collectedLabel` na UI — menos ambíguo.
     */
    totalInvoicedLabel: string;
    /** Faturas FECHADA/ABERTA — a receber. */
    toCollectLabel: string;
    toCollectCount: number;
    /** Faturas PAGA — já recebido. */
    collectedLabel: string;
    collectedCount: number;
    activeSubscriptions: number;
    mrrEstimateLabel: string;
    pendingMessages: number;
    pendingRecurrenceCharges: number;
  };
  revenue: {
    pendingPayPerUseLabel: string;
    pendingRecurrenceLabel: string;
    invoicedOpenLabel: string;
    invoicedPaidLabel: string;
  };
  crm: {
    activeContracts: number;
    byStatus: { status: string; label: string; count: number }[];
  };
  topPendingBilling: {
    patientId: string;
    patientName: string;
    totalLabel: string;
    itemsCount: number;
  }[];
  recentActivity: {
    id: string;
    action: string;
    description: string;
    createdAtLabel: string;
    actorName: string | null;
  }[];
  /** Produção do módulo Gestão clínica (mês civil BRT) — eixo distinto das faturas. */
  clinicFinance: {
    year: number;
    month: number;
    examCount: number;
    revenueLabel: string;
    expensesLabel: string;
    profitLabel: string;
  } | null;
};

/**
 * Consolida KPIs executivos do tenant para o Dashboard Interno.
 * Agrega faturamento Pay Per Use, CRM, recorrência e comunicação.
 */
export async function getExecutiveDashboard(
  tenantId: string,
): Promise<ExecutiveDashboardData> {
  const prisma = await getPrisma();
  const todayStart = startOfToday();
  const todayEnd = endOfToday();

  const [
    totalPatients,
    totalCompanies,
    appointmentsToday,
    pendingUsages,
    invoices,
    subscriptions,
    pendingCharges,
    pendingMessages,
    companies,
    recentEvents,
  ] = await Promise.all([
    prisma.patient.count({ where: { tenantId } }),
    prisma.company.count({ where: { tenantId } }),
    prisma.appointment.count({
      where: {
        tenantId,
        scheduledAt: { gte: todayStart, lte: todayEnd },
        status: { not: "CANCELADO" },
      },
    }),
    prisma.procedureUsage.findMany({
      where: { billed: false, appointment: { tenantId } },
      include: {
        appointment: { include: { patient: { select: { id: true, name: true } } } },
      },
    }),
    prisma.invoice.findMany({ where: { tenantId } }),
    prisma.subscription.findMany({ where: { tenantId, status: "ATIVA" } }),
    prisma.subscriptionCharge.findMany({
      where: {
        status: "PENDENTE",
        subscription: { tenantId },
      },
    }),
    prisma.message.count({ where: { tenantId, status: "PENDENTE" } }),
    prisma.company.findMany({ where: { tenantId }, select: { status: true, contractActive: true } }),
    prisma.timelineEvent.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const pendingBillingTotal = pendingUsages.reduce((sum, u) => sum + u.priceCharged, 0);
  const pendingRecurrenceTotal = pendingCharges.reduce((sum, c) => sum + c.amount, 0);

  const invoiceMoney = summarizeInvoiceMoney(invoices);

  const mrrEstimate = subscriptions.reduce(
    (sum, sub) => sum + monthlyEquivalent(sub.amount, sub.billingCycle),
    0,
  );

  const statusCounts = new Map<string, number>();
  for (const company of companies) {
    statusCounts.set(company.status, (statusCounts.get(company.status) ?? 0) + 1);
  }

  const crmByStatus = [...statusCounts.entries()]
    .map(([status, count]) => ({
      status,
      label: companyStatusLabel(status),
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const activeContracts = companies.filter((c) => c.contractActive).length;

  const billingGroups = new Map<
    string,
    { patientId: string; patientName: string; total: number; itemsCount: number }
  >();
  for (const usage of pendingUsages) {
    const patient = usage.appointment.patient;
    const group = billingGroups.get(patient.id) ?? {
      patientId: patient.id,
      patientName: patient.name,
      total: 0,
      itemsCount: 0,
    };
    group.total += usage.priceCharged;
    group.itemsCount += 1;
    billingGroups.set(patient.id, group);
  }

  const topPendingBilling = [...billingGroups.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map((g) => ({
      patientId: g.patientId,
      patientName: g.patientName,
      totalLabel: formatBRL(g.total),
      itemsCount: g.itemsCount,
    }));

  const actorIds = [
    ...new Set(recentEvents.map((e) => e.createdBy).filter(Boolean)),
  ] as string[];
  const actors =
    actorIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: actorIds } },
          select: { id: true, name: true },
        })
      : [];
  const actorMap = new Map(actors.map((a) => [a.id, a.name]));

  const now = new Date();
  const [civilYear, civilMonth] = civilDateISO(now).split("-").map(Number);

  const clinic = await getClinicFinanceKpis(tenantId, civilYear, civilMonth);
  const clinicFinance: ExecutiveDashboardData["clinicFinance"] =
    clinic.examCount > 0 || clinic.totalExpenses > 0
      ? {
          year: clinic.year,
          month: clinic.month,
          examCount: clinic.examCount,
          revenueLabel: formatBRL(clinic.revenue),
          expensesLabel: formatBRL(clinic.totalExpenses),
          profitLabel: formatBRL(clinic.operatingProfit),
        }
      : null;

  return {
    generatedAt: now.toISOString(),
    generatedAtLabel: dateTime(now),
    kpis: {
      totalPatients,
      totalCompanies,
      appointmentsToday,
      pendingBillingLabel: formatBRL(pendingBillingTotal),
      totalInvoicedLabel: formatBRL(invoiceMoney.emitted),
      toCollectLabel: formatBRL(invoiceMoney.open),
      toCollectCount: invoiceMoney.openCount,
      collectedLabel: formatBRL(invoiceMoney.paid),
      collectedCount: invoiceMoney.paidCount,
      activeSubscriptions: subscriptions.length,
      mrrEstimateLabel: formatBRL(mrrEstimate),
      pendingMessages,
      pendingRecurrenceCharges: pendingCharges.length,
    },
    revenue: {
      pendingPayPerUseLabel: formatBRL(pendingBillingTotal),
      pendingRecurrenceLabel: formatBRL(pendingRecurrenceTotal),
      invoicedOpenLabel: formatBRL(invoiceMoney.open),
      invoicedPaidLabel: formatBRL(invoiceMoney.paid),
    },
    crm: {
      activeContracts,
      byStatus: crmByStatus,
    },
    topPendingBilling,
    recentActivity: recentEvents.map((event) => ({
      id: event.id,
      action: event.action,
      description: event.description,
      createdAtLabel: dateTime(event.createdAt),
      actorName: event.createdBy ? (actorMap.get(event.createdBy) ?? null) : null,
    })),
    clinicFinance,
  };
}
