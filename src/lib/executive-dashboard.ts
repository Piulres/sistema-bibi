import "server-only";
import { getPrisma } from "@/lib/db";
import { companyStatusLabel } from "@/lib/company-crm";
import { formatBRL } from "@/lib/pricing";
import { monthsForBillingCycle } from "@/lib/subscription";

const dateTime = (value: Date) =>
  value.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
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
    pendingBillingLabel: string;
    totalInvoicedLabel: string;
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

  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const invoicedOpen = invoices
    .filter((inv) => inv.status === "ABERTA" || inv.status === "FECHADA")
    .reduce((sum, inv) => sum + inv.total, 0);
  const invoicedPaid = invoices
    .filter((inv) => inv.status === "PAGA")
    .reduce((sum, inv) => sum + inv.total, 0);

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

  return {
    generatedAt: now.toISOString(),
    generatedAtLabel: dateTime(now),
    kpis: {
      totalPatients,
      totalCompanies,
      appointmentsToday,
      pendingBillingLabel: formatBRL(pendingBillingTotal),
      totalInvoicedLabel: formatBRL(totalInvoiced),
      activeSubscriptions: subscriptions.length,
      mrrEstimateLabel: formatBRL(mrrEstimate),
      pendingMessages,
      pendingRecurrenceCharges: pendingCharges.length,
    },
    revenue: {
      pendingPayPerUseLabel: formatBRL(pendingBillingTotal),
      pendingRecurrenceLabel: formatBRL(pendingRecurrenceTotal),
      invoicedOpenLabel: formatBRL(invoicedOpen),
      invoicedPaidLabel: formatBRL(invoicedPaid),
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
  };
}
