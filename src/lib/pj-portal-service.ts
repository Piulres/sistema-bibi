import "server-only";
import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/pricing";
import { billingCycleLabel, subscriptionStatusLabel } from "@/lib/subscription";

const dateOnly = (value: Date) =>
  value.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

export type PjAlert = {
  tone: "warning" | "danger" | "info";
  message: string;
  href?: string;
  actionLabel?: string;
};

export type PjPortalOverview = {
  company: {
    name: string;
    cnpj: string;
    status: string;
    contractActive: boolean;
    beneficiariesCount: number;
    totalConsumed: number;
    totalConsumedLabel: string;
    pendingInvoicesLabel: string;
    mrrLabel: string;
  };
  alerts: PjAlert[];
  beneficiaries: {
    id: string;
    name: string;
    cpf: string;
    usageCount: number;
    consumed: number;
    consumedLabel: string;
    pendingLabel: string;
  }[];
  invoices: {
    id: string;
    patientName: string;
    total: number;
    totalLabel: string;
    status: string;
    createdAt: string;
    createdAtLabel: string;
  }[];
  subscriptions: {
    id: string;
    patientName: string;
    status: string;
    statusLabel: string;
    billingCycleLabel: string;
    amountLabel: string;
    pendingCharges: number;
  }[];
  summary: {
    openInvoicesCount: number;
    openInvoicesTotalLabel: string;
    activeSubscriptions: number;
  };
};

export async function getPjPortalOverview(
  companyId: string,
  tenantId: string,
): Promise<PjPortalOverview | null> {
  const company = await prisma.company.findFirst({
    where: { id: companyId, tenantId },
    include: {
      patients: {
        include: {
          appointments: { include: { usages: true } },
          subscriptions: { include: { charges: true } },
        },
        orderBy: { name: "asc" },
      },
      invoices: {
        include: { patient: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      subscriptions: {
        include: {
          patient: { select: { name: true } },
          charges: true,
        },
      },
    },
  });

  if (!company) return null;

  const alerts: PjAlert[] = [];

  if (company.status === "INADIMPLENTE") {
    alerts.push({
      tone: "danger",
      message: "Empresa marcada como INADIMPLENTE — regularize o contrato com a operadora.",
    });
  } else if (company.status === "NEGOCIACAO") {
    alerts.push({
      tone: "warning",
      message: "Contrato em negociação — alguns serviços podem estar limitados.",
    });
  }

  const openInvoices = company.invoices.filter((inv) => inv.status === "FECHADA");
  const openTotal = openInvoices.reduce((s, inv) => s + inv.total, 0);

  if (openInvoices.length > 0) {
    alerts.push({
      tone: "warning",
      message: `${openInvoices.length} fatura(s) em aberto totalizando ${formatBRL(openTotal)}.`,
    });
  }

  const overdueCharges = company.subscriptions.flatMap((sub) =>
    sub.charges.filter(
      (c) => c.status === "PENDENTE" && c.dueDate.getTime() < Date.now(),
    ),
  );

  if (overdueCharges.length > 0) {
    alerts.push({
      tone: "danger",
      message: `${overdueCharges.length} cobrança(s) de assinatura vencida(s).`,
      href: "#assinaturas",
      actionLabel: "Ver assinaturas",
    });
  }

  const beneficiaries = company.patients.map((p) => {
    const usages = p.appointments.flatMap((a) => a.usages);
    const consumed = usages.reduce((s, u) => s + u.priceCharged, 0);
    const pending = usages.filter((u) => !u.billed).reduce((s, u) => s + u.priceCharged, 0);

    return {
      id: p.id,
      name: p.name,
      cpf: p.cpf,
      usageCount: usages.length,
      consumed,
      consumedLabel: formatBRL(consumed),
      pendingLabel: formatBRL(pending),
    };
  });

  const totalConsumed = beneficiaries.reduce((s, b) => s + b.consumed, 0);

  const activeSubscriptions = company.subscriptions.filter((s) => s.status === "ATIVA");
  const mrr = activeSubscriptions.reduce((s, sub) => {
    const factor =
      sub.billingCycle === "MENSAL"
        ? 1
        : sub.billingCycle === "TRIMESTRAL"
          ? 1 / 3
          : sub.billingCycle === "SEMESTRAL"
            ? 1 / 6
            : 1 / 12;
    return s + sub.amount * factor;
  }, 0);

  return {
    company: {
      name: company.name,
      cnpj: company.cnpj,
      status: company.status,
      contractActive: company.contractActive,
      beneficiariesCount: company.patients.length,
      totalConsumed,
      totalConsumedLabel: formatBRL(totalConsumed),
      pendingInvoicesLabel: formatBRL(openTotal),
      mrrLabel: formatBRL(mrr),
    },
    alerts,
    beneficiaries,
    invoices: company.invoices.map((inv) => ({
      id: inv.id,
      patientName: inv.patient.name,
      total: inv.total,
      totalLabel: formatBRL(inv.total),
      status: inv.status,
      createdAt: inv.createdAt.toISOString(),
      createdAtLabel: dateOnly(inv.createdAt),
    })),
    subscriptions: company.subscriptions.map((sub) => ({
      id: sub.id,
      patientName: sub.patient.name,
      status: sub.status,
      statusLabel: subscriptionStatusLabel(sub.status),
      billingCycleLabel: billingCycleLabel(sub.billingCycle),
      amountLabel: formatBRL(sub.amount),
      pendingCharges: sub.charges.filter((c) => c.status === "PENDENTE").length,
    })),
    summary: {
      openInvoicesCount: openInvoices.length,
      openInvoicesTotalLabel: formatBRL(openTotal),
      activeSubscriptions: activeSubscriptions.length,
    },
  };
}

export async function buildPjReportCsv(companyId: string, tenantId: string): Promise<string | null> {
  const overview = await getPjPortalOverview(companyId, tenantId);
  if (!overview) return null;

  const lines = [
    "secao,campo,valor",
    `empresa,nome,"${overview.company.name}"`,
    `empresa,cnpj,${overview.company.cnpj}`,
    `empresa,status,${overview.company.status}`,
    `empresa,consumo_total,${overview.company.totalConsumedLabel}`,
    `empresa,faturas_abertas,${overview.summary.openInvoicesTotalLabel}`,
  ];

  for (const b of overview.beneficiaries) {
    lines.push(`beneficiario,nome,"${b.name}"`);
    lines.push(`beneficiario,cpf,${b.cpf}`);
    lines.push(`beneficiario,consumo,${b.consumedLabel}`);
    lines.push(`beneficiario,pendente,${b.pendingLabel}`);
  }

  for (const inv of overview.invoices) {
    lines.push(
      `fatura,data,${inv.createdAtLabel},beneficiario,"${inv.patientName}",valor,${inv.totalLabel},status,${inv.status}`,
    );
  }

  return lines.join("\n");
}
