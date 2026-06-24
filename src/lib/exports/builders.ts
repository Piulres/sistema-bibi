import "server-only";
import { getPrisma } from "@/lib/db";
import { formatBRL } from "@/lib/pricing";
import { getBeneficiaryOverview } from "@/lib/beneficiary-overview";
import { getPatientOverview, type PatientOverviewData } from "@/lib/patient-overview";
import { getProviderPatientOverview, type ProviderPatientOverviewData } from "@/lib/provider-patient-overview";
import { getPjPortalOverview } from "@/lib/pj-portal-service";
import { getPrestadorExtrato } from "@/lib/prestador-extrato";
import { listSubscriptions } from "@/lib/subscription-service";
import {
  getTenantAuditEvents,
  TIMELINE_ENTITY_LABELS,
  type TenantAuditFilters,
} from "@/lib/timeline";
import type { TabularExport } from "@/lib/exports/tabular";

const dateTime = (value: Date) =>
  value.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export type PatientExportSection =
  | "timeline"
  | "appointments"
  | "usages"
  | "records"
  | "invoices"
  | "summary";

export type BeneficiaryExportSection =
  | "resumo"
  | "agenda"
  | "consumo"
  | "faturas"
  | "historico"
  | "prontuario"
  | "assinatura";

export async function buildAuditTabularExport(
  tenantId: string,
  filters: TenantAuditFilters,
): Promise<TabularExport> {
  const result = await getTenantAuditEvents(tenantId, {
    ...filters,
    page: 1,
    limit: 10_000,
  });

  return {
    title: "Auditoria do tenant",
    subtitle: `${result.total} evento(s) — exportação em ${new Date().toLocaleString("pt-BR")}`,
    sheetName: "Auditoria",
    columns: [
      { header: "Data", key: "createdAt", width: 18 },
      { header: "Entidade", key: "entityType", width: 16 },
      { header: "Ação", key: "action", width: 14 },
      { header: "Descrição", key: "description", width: 40 },
      { header: "Responsável", key: "actorName", width: 18 },
      { header: "ID entidade", key: "entityId", width: 22 },
      { header: "Campos alterados", key: "fieldsChanged", width: 28 },
      { header: "Reversível", key: "reversible", width: 10 },
    ],
    rows: result.events.map((event) => ({
      createdAt: event.createdAtLabel,
      entityType:
        TIMELINE_ENTITY_LABELS[event.entityType as keyof typeof TIMELINE_ENTITY_LABELS] ??
        event.entityType,
      action: event.action,
      description: event.description,
      actorName: event.actorName ?? "Sistema",
      entityId: event.entityId,
      fieldsChanged: event.metadata?.fieldsChanged?.join(", ") ?? "",
      reversible: event.reversible ? "Sim" : "Não",
    })),
  };
}

export async function buildBillingTabularExport(tenantId: string): Promise<TabularExport> {
  const prisma = await getPrisma();
  const [invoices, pendingUsages] = await Promise.all([
    prisma.invoice.findMany({
      where: { tenantId },
      include: { patient: true, company: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.procedureUsage.findMany({
      where: { billed: false, appointment: { tenantId } },
      include: {
        procedure: true,
        appointment: { include: { patient: { include: { company: true } } } },
      },
      orderBy: { performedAt: "desc" },
    }),
  ]);

  const rows = [
    ...invoices.map((invoice) => ({
      tipo: "Fatura",
      beneficiario: invoice.patient.name,
      empresa: invoice.company?.name ?? "Particular",
      descricao: "Fatura consolidada",
      valor: formatBRL(invoice.total),
      status: invoice.status,
      data: dateTime(invoice.createdAt),
    })),
    ...pendingUsages.map((usage) => ({
      tipo: "Pendente PPU",
      beneficiario: usage.appointment.patient.name,
      empresa: usage.appointment.patient.company?.name ?? "Particular",
      descricao: usage.procedure.name,
      valor: formatBRL(usage.priceCharged),
      status: "NAO_FATURADO",
      data: dateTime(usage.performedAt),
    })),
  ];

  return {
    title: "Faturamento e Pay Per Use",
    subtitle: `${invoices.length} fatura(s), ${pendingUsages.length} pendência(s)`,
    sheetName: "Faturamento",
    columns: [
      { header: "Tipo", key: "tipo", width: 14 },
      { header: "Beneficiário", key: "beneficiario", width: 22 },
      { header: "Empresa", key: "empresa", width: 18 },
      { header: "Descrição", key: "descricao", width: 28 },
      { header: "Valor", key: "valor", width: 12 },
      { header: "Status", key: "status", width: 14 },
      { header: "Data", key: "data", width: 18 },
    ],
    rows,
  };
}

export async function buildCrmTabularExport(tenantId: string): Promise<TabularExport> {
  const prisma = await getPrisma();
  const companies = await prisma.company.findMany({
    where: { tenantId },
    include: { _count: { select: { patients: true, invoices: true } } },
    orderBy: { name: "asc" },
  });

  return {
    title: "Pipeline CRM",
    subtitle: `${companies.length} empresa(s)`,
    sheetName: "CRM",
    columns: [
      { header: "Empresa", key: "name", width: 24 },
      { header: "CNPJ", key: "cnpj", width: 18 },
      { header: "Status", key: "status", width: 14 },
      { header: "Contrato ativo", key: "contractActive", width: 14 },
      { header: "Beneficiários", key: "patients", width: 14 },
      { header: "Faturas", key: "invoices", width: 10 },
    ],
    rows: companies.map((company) => ({
      name: company.name,
      cnpj: company.cnpj,
      status: company.status,
      contractActive: company.contractActive ? "Sim" : "Não",
      patients: company._count.patients,
      invoices: company._count.invoices,
    })),
  };
}

export async function buildSubscriptionsTabularExport(
  tenantId: string,
): Promise<TabularExport> {
  const subscriptions = await listSubscriptions(tenantId);

  return {
    title: "Assinaturas recorrentes",
    subtitle: `${subscriptions.length} assinatura(s)`,
    sheetName: "Assinaturas",
    columns: [
      { header: "Beneficiário", key: "patientName", width: 22 },
      { header: "Empresa", key: "companyName", width: 18 },
      { header: "Status", key: "statusLabel", width: 14 },
      { header: "Ciclo", key: "billingCycleLabel", width: 12 },
      { header: "Valor", key: "amountLabel", width: 12 },
      { header: "Cobranças pendentes", key: "pendingCharges", width: 18 },
      { header: "Próximo vencimento", key: "nextDueDateLabel", width: 16 },
      { header: "Descrição", key: "description", width: 28 },
    ],
    rows: subscriptions.map((sub) => ({
      patientName: sub.patientName,
      companyName: sub.companyName ?? "Particular",
      statusLabel: sub.statusLabel,
      billingCycleLabel: sub.billingCycleLabel,
      amountLabel: sub.amountLabel,
      pendingCharges: sub.pendingCharges,
      nextDueDateLabel: sub.nextDueDateLabel ?? "—",
      description: sub.description ?? "",
    })),
  };
}

export function buildPatientSectionTabularExport(
  overview: PatientOverviewData,
  section: PatientExportSection,
): TabularExport {
  const patientName = overview.patient.name;

  switch (section) {
    case "timeline":
      return {
        title: `Histórico — ${patientName}`,
        sheetName: "Timeline",
        columns: [
          { header: "Data", key: "createdAt", width: 18 },
          { header: "Ação", key: "action", width: 14 },
          { header: "Descrição", key: "description", width: 40 },
          { header: "Responsável", key: "actorName", width: 18 },
          { header: "Entidade", key: "entityType", width: 14 },
        ],
        rows: overview.timeline.map((event) => ({
          createdAt: event.createdAtLabel,
          action: event.action,
          description: event.description,
          actorName: event.actorName ?? "Sistema",
          entityType: event.entityType,
        })),
      };
    case "appointments":
      return {
        title: `Atendimentos — ${patientName}`,
        sheetName: "Atendimentos",
        columns: [
          { header: "Data", key: "scheduledAt", width: 18 },
          { header: "Prestador", key: "providerName", width: 20 },
          { header: "Status", key: "status", width: 12 },
          { header: "Modalidade", key: "modality", width: 12 },
          { header: "Motivo", key: "reason", width: 24 },
          { header: "Procedimentos", key: "usagesCount", width: 14 },
        ],
        rows: overview.appointments.map((appointment) => ({
          scheduledAt: appointment.scheduledAtLabel,
          providerName: appointment.providerName,
          status: appointment.status,
          modality: appointment.modality,
          reason: appointment.reason ?? "",
          usagesCount: appointment.usagesCount,
        })),
      };
    case "usages":
      return {
        title: `Consumo (Pay Per Use) — ${patientName}`,
        sheetName: "Consumo",
        columns: [
          { header: "Procedimento", key: "procedure", width: 24 },
          { header: "Categoria", key: "category", width: 14 },
          { header: "Atendimento", key: "appointmentDate", width: 18 },
          { header: "Realizado em", key: "performedAt", width: 18 },
          { header: "Faturado", key: "billed", width: 10 },
          { header: "Valor", key: "price", width: 12 },
        ],
        rows: overview.usages.map((usage) => ({
          procedure: usage.procedure,
          category: usage.category,
          appointmentDate: usage.appointmentDateLabel,
          performedAt: usage.performedAtLabel,
          billed: usage.billed ? "Sim" : "Não",
          price: usage.priceLabel,
        })),
      };
    case "records":
      return {
        title: `Prontuário — ${patientName}`,
        sheetName: "Prontuário",
        columns: [
          { header: "Data", key: "createdAt", width: 18 },
          { header: "Tipo", key: "recordType", width: 14 },
          { header: "Título", key: "title", width: 20 },
          { header: "Prestador", key: "providerName", width: 20 },
          { header: "Atendimento", key: "appointmentDate", width: 18 },
          { header: "Conteúdo", key: "content", width: 50 },
        ],
        rows: overview.medicalRecords.map((record) => ({
          createdAt: record.createdAtLabel,
          recordType: record.recordType,
          title: record.title ?? "",
          providerName: record.providerName,
          appointmentDate: record.appointmentDateLabel ?? "",
          content: record.content,
        })),
      };
    case "invoices":
      return {
        title: `Faturas — ${patientName}`,
        sheetName: "Faturas",
        columns: [
          { header: "Data", key: "createdAt", width: 18 },
          { header: "Status", key: "status", width: 12 },
          { header: "Empresa", key: "company", width: 18 },
          { header: "Total", key: "total", width: 12 },
          { header: "Itens", key: "items", width: 50 },
        ],
        rows: overview.invoices.map((invoice) => ({
          createdAt: invoice.createdAtLabel,
          status: invoice.status,
          company: invoice.company ?? "Particular",
          total: invoice.totalLabel,
          items: invoice.items
            .map((item) => `${item.description} (${item.amountLabel})`)
            .join("; "),
        })),
      };
    case "summary":
    default:
      return {
        title: `Resumo Cliente 360° — ${patientName}`,
        sheetName: "Resumo",
        columns: [
          { header: "Campo", key: "field", width: 24 },
          { header: "Valor", key: "value", width: 36 },
        ],
        rows: [
          { field: "Nome", value: overview.patient.name },
          { field: "CPF", value: overview.patient.cpf },
          { field: "Nascimento", value: overview.patient.birthDateLabel },
          { field: "Telefone", value: overview.patient.phone ?? "—" },
          {
            field: "Empresa",
            value: overview.patient.company?.name ?? "Particular",
          },
          { field: "Atendimentos", value: overview.summary.totalAppointments },
          { field: "Procedimentos", value: overview.summary.totalUsages },
          { field: "Registros clínicos", value: overview.summary.totalRecords },
          { field: "Total faturado", value: overview.summary.totalInvoicedLabel },
          { field: "Pendente PPU", value: overview.summary.pendingAmountLabel },
        ],
      };
  }
}

export async function buildPatientOverviewTabularExport(
  patientId: string,
  tenantId: string,
  section: PatientExportSection,
): Promise<TabularExport | null> {
  const overview = await getPatientOverview(patientId, tenantId);
  if (!overview) return null;
  return buildPatientSectionTabularExport(overview, section);
}

export async function buildBeneficiarySectionTabularExport(
  patientId: string,
  tenantId: string,
  section: BeneficiaryExportSection,
): Promise<TabularExport | null> {
  const overview = await getBeneficiaryOverview(patientId, tenantId);
  if (!overview) return null;

  const sectionMap: Record<BeneficiaryExportSection, PatientExportSection | "assinatura"> = {
    resumo: "summary",
    agenda: "appointments",
    consumo: "usages",
    faturas: "invoices",
    historico: "timeline",
    prontuario: "records",
    assinatura: "assinatura",
  };

  const mapped = sectionMap[section];
  if (mapped === "assinatura") {
    return {
      title: `Assinatura — ${overview.patient.name}`,
      sheetName: "Assinatura",
      columns: [
        { header: "Status", key: "statusLabel", width: 14 },
        { header: "Ciclo", key: "billingCycleLabel", width: 12 },
        { header: "Valor", key: "amountLabel", width: 12 },
        { header: "Pendentes", key: "pendingCharges", width: 12 },
        { header: "Próximo venc.", key: "nextDueDateLabel", width: 14 },
        { header: "Cobrança", key: "chargeDue", width: 14 },
        { header: "Valor cobrança", key: "chargeAmount", width: 14 },
        { header: "Status cobrança", key: "chargeStatus", width: 14 },
      ],
      rows: overview.subscriptions.flatMap((sub) =>
        sub.charges.length > 0
          ? sub.charges.map((charge) => ({
              statusLabel: sub.statusLabel,
              billingCycleLabel: sub.billingCycleLabel,
              amountLabel: sub.amountLabel,
              pendingCharges: sub.pendingCharges,
              nextDueDateLabel: sub.nextDueDateLabel ?? "—",
              chargeDue: charge.dueDateLabel,
              chargeAmount: charge.amountLabel,
              chargeStatus: charge.status,
            }))
          : [
              {
                statusLabel: sub.statusLabel,
                billingCycleLabel: sub.billingCycleLabel,
                amountLabel: sub.amountLabel,
                pendingCharges: sub.pendingCharges,
                nextDueDateLabel: sub.nextDueDateLabel ?? "—",
                chargeDue: "—",
                chargeAmount: "—",
                chargeStatus: "—",
              },
            ],
      ),
    };
  }

  return buildPatientSectionTabularExport(overview, mapped);
}

export async function buildExtratoTabularExport(
  tenantId: string,
  providerId: string,
  from?: string,
  to?: string,
): Promise<TabularExport> {
  const extrato = await getPrestadorExtrato(tenantId, providerId, from, to);

  return {
    title: "Extrato do prestador",
    subtitle: extrato.periodLabel,
    sheetName: "Extrato",
    columns: [
      { header: "Realizado em", key: "performedAt", width: 18 },
      { header: "Paciente", key: "patientName", width: 22 },
      { header: "Procedimento", key: "procedure", width: 24 },
      { header: "Categoria", key: "category", width: 14 },
      { header: "Valor", key: "price", width: 12 },
      { header: "Faturado", key: "billed", width: 10 },
      { header: "Status fatura", key: "invoiceStatus", width: 14 },
      { header: "Consulta", key: "appointmentDate", width: 18 },
    ],
    rows: extrato.lines.map((line) => ({
      performedAt: line.performedAtLabel,
      patientName: line.patientName,
      procedure: line.procedure,
      category: line.category,
      price: line.priceLabel,
      billed: line.billed ? "Sim" : "Não",
      invoiceStatus: line.invoiceStatus ?? "—",
      appointmentDate: line.appointmentDateLabel,
    })),
  };
}

export async function buildPrestadorProceduresTabularExport(
  tenantId: string,
  providerId: string,
  from?: string,
  to?: string,
): Promise<TabularExport> {
  const extrato = await getPrestadorExtrato(tenantId, providerId, from, to);
  return {
    title: "Procedimentos do prestador",
    subtitle: extrato.periodLabel,
    sheetName: "Procedimentos",
    columns: [
      { header: "Data", key: "performedAt", width: 18 },
      { header: "Paciente", key: "patientName", width: 22 },
      { header: "Procedimento", key: "procedure", width: 24 },
      { header: "Categoria", key: "category", width: 14 },
      { header: "Valor", key: "price", width: 12 },
      { header: "Faturado", key: "billed", width: 10 },
      { header: "Status fatura", key: "invoiceStatus", width: 14 },
    ],
    rows: extrato.lines.map((line) => ({
      performedAt: line.performedAtLabel,
      patientName: line.patientName,
      procedure: line.procedure,
      category: line.category,
      price: line.priceLabel,
      billed: line.billed ? "Sim" : "Não",
      invoiceStatus: line.invoiceStatus ?? "—",
    })),
  };
}

export async function buildPrestadorAppointmentsTabularExport(
  tenantId: string,
  providerId: string,
  from?: string,
  to?: string,
): Promise<TabularExport> {
  const prisma = await getPrisma();
  const fromDate = from ? new Date(`${from}T00:00:00`) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const toDate = to
    ? new Date(`${to}T23:59:59`)
    : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);

  const appointments = await prisma.appointment.findMany({
    where: {
      tenantId,
      providerId,
      scheduledAt: { gte: fromDate, lte: toDate },
    },
    include: {
      patient: { select: { name: true } },
      usages: true,
    },
    orderBy: { scheduledAt: "asc" },
  });

  return {
    title: "Atendimentos do prestador",
    subtitle: `${fromDate.toLocaleDateString("pt-BR")} — ${toDate.toLocaleDateString("pt-BR")}`,
    sheetName: "Atendimentos",
    columns: [
      { header: "Data", key: "scheduledAt", width: 18 },
      { header: "Paciente", key: "patientName", width: 22 },
      { header: "Status", key: "status", width: 12 },
      { header: "Modalidade", key: "modality", width: 12 },
      { header: "Procedimentos", key: "usagesCount", width: 14 },
      { header: "Valor total", key: "total", width: 12 },
    ],
    rows: appointments.map((appointment) => ({
      scheduledAt: dateTime(appointment.scheduledAt),
      patientName: appointment.patient.name,
      status: appointment.status,
      modality: appointment.modality,
      usagesCount: appointment.usages.length,
      total: formatBRL(appointment.usages.reduce((sum, usage) => sum + usage.priceCharged, 0)),
    })),
  };
}

export async function buildPjTabularExport(
  companyId: string,
  tenantId: string,
): Promise<TabularExport | null> {
  const overview = await getPjPortalOverview(companyId, tenantId);
  if (!overview) return null;

  const rows = [
    ...overview.beneficiaries.map((beneficiary) => ({
      secao: "Beneficiário",
      nome: beneficiary.name,
      cpf: beneficiary.cpf,
      consumo: beneficiary.consumedLabel,
      pendente: beneficiary.pendingLabel,
      procedimentos: beneficiary.usageCount,
      fatura: "",
      status: "",
    })),
    ...overview.invoices.map((invoice) => ({
      secao: "Fatura",
      nome: invoice.patientName,
      cpf: "",
      consumo: "",
      pendente: "",
      procedimentos: "",
      fatura: invoice.totalLabel,
      status: invoice.status,
    })),
    ...overview.subscriptions.map((sub) => ({
      secao: "Assinatura",
      nome: sub.patientName,
      cpf: "",
      consumo: sub.amountLabel,
      pendente: String(sub.pendingCharges),
      procedimentos: sub.billingCycleLabel,
      fatura: "",
      status: sub.statusLabel,
    })),
  ];

  return {
    title: `Relatório PJ — ${overview.company.name}`,
    subtitle: `CNPJ ${overview.company.cnpj} · Consumo ${overview.company.totalConsumedLabel}`,
    sheetName: "Portal PJ",
    columns: [
      { header: "Seção", key: "secao", width: 14 },
      { header: "Nome", key: "nome", width: 24 },
      { header: "CPF", key: "cpf", width: 14 },
      { header: "Consumo/Valor", key: "consumo", width: 14 },
      { header: "Pendente", key: "pendente", width: 12 },
      { header: "Detalhe", key: "procedimentos", width: 14 },
      { header: "Fatura", key: "fatura", width: 12 },
      { header: "Status", key: "status", width: 12 },
    ],
    rows,
  };
}

export async function buildInvoiceItemsTabularExport(
  tenantId: string,
  invoiceId: string,
  scope?: { companyId?: string; patientId?: string },
): Promise<TabularExport | null> {
  const prisma = await getPrisma();
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      tenantId,
      ...(scope?.companyId ? { companyId: scope.companyId } : {}),
      ...(scope?.patientId ? { patientId: scope.patientId } : {}),
    },
    include: {
      patient: { select: { name: true } },
      company: { select: { name: true } },
      items: true,
    },
  });

  if (!invoice) return null;

  return {
    title: `Fatura — ${invoice.patient.name}`,
    subtitle: `${dateTime(invoice.createdAt)} · ${invoice.status} · ${formatBRL(invoice.total)}`,
    sheetName: "Fatura",
    columns: [
      { header: "Descrição", key: "description", width: 36 },
      { header: "Valor", key: "amount", width: 14 },
    ],
    rows: invoice.items.map((item) => ({
      description: item.description,
      amount: formatBRL(item.amount),
    })),
  };
}

export type ProviderPatientExportSection =
  | "summary"
  | "appointments"
  | "usages"
  | "records"
  | "timeline";

export function buildProviderPatientSectionTabularExport(
  overview: ProviderPatientOverviewData,
  section: ProviderPatientExportSection,
): TabularExport {
  const patientName = overview.patient.name;

  switch (section) {
    case "timeline":
      return {
        title: `Histórico — ${patientName} (prestador)`,
        sheetName: "Timeline",
        columns: [
          { header: "Data", key: "createdAt", width: 18 },
          { header: "Ação", key: "action", width: 14 },
          { header: "Descrição", key: "description", width: 40 },
          { header: "Responsável", key: "actorName", width: 18 },
        ],
        rows: overview.timeline.map((event) => ({
          createdAt: event.createdAtLabel,
          action: event.action,
          description: event.description,
          actorName: event.actorName ?? "Sistema",
        })),
      };
    case "appointments":
      return {
        title: `Atendimentos — ${patientName} (prestador)`,
        sheetName: "Atendimentos",
        columns: [
          { header: "Data", key: "scheduledAt", width: 18 },
          { header: "Status", key: "status", width: 12 },
          { header: "Modalidade", key: "modality", width: 12 },
          { header: "Motivo", key: "reason", width: 24 },
          { header: "Procedimentos", key: "usagesCount", width: 14 },
        ],
        rows: overview.appointments.map((appointment) => ({
          scheduledAt: appointment.scheduledAtLabel,
          status: appointment.status,
          modality: appointment.modality,
          reason: appointment.reason ?? "",
          usagesCount: appointment.usagesCount,
        })),
      };
    case "usages":
      return {
        title: `Procedimentos — ${patientName} (prestador)`,
        sheetName: "Procedimentos",
        columns: [
          { header: "Procedimento", key: "procedure", width: 24 },
          { header: "Categoria", key: "category", width: 14 },
          { header: "Atendimento", key: "appointmentDate", width: 18 },
          { header: "Realizado em", key: "performedAt", width: 18 },
        ],
        rows: overview.usages.map((usage) => ({
          procedure: usage.procedure,
          category: usage.category,
          appointmentDate: usage.appointmentDateLabel,
          performedAt: usage.performedAtLabel,
        })),
      };
    case "records":
      return {
        title: `Prontuário — ${patientName} (prestador)`,
        sheetName: "Prontuário",
        columns: [
          { header: "Data", key: "createdAt", width: 18 },
          { header: "Tipo", key: "recordType", width: 14 },
          { header: "Título", key: "title", width: 20 },
          { header: "Atendimento", key: "appointmentDate", width: 18 },
          { header: "Conteúdo", key: "content", width: 50 },
        ],
        rows: overview.medicalRecords.map((record) => ({
          createdAt: record.createdAtLabel,
          recordType: record.recordType,
          title: record.title ?? "",
          appointmentDate: record.appointmentDateLabel ?? "",
          content: record.content,
        })),
      };
    case "summary":
    default:
      return {
        title: `Resumo — ${patientName} (prestador)`,
        sheetName: "Resumo",
        columns: [
          { header: "Campo", key: "field", width: 24 },
          { header: "Valor", key: "value", width: 36 },
        ],
        rows: [
          { field: "Nome", value: overview.patient.name },
          { field: "CPF", value: overview.patient.cpf },
          { field: "Nascimento", value: overview.patient.birthDateLabel },
          { field: "Telefone", value: overview.patient.phone ?? "—" },
          { field: "Empresa", value: overview.patient.company ?? "Particular" },
          { field: "Atendimentos", value: overview.summary.totalAppointments },
          { field: "Procedimentos", value: overview.summary.totalUsages },
          { field: "Registros clínicos", value: overview.summary.totalRecords },
          { field: "Última visita", value: overview.summary.lastVisitLabel ?? "—" },
          { field: "Próxima visita", value: overview.summary.nextVisitLabel ?? "—" },
        ],
      };
  }
}

export async function buildProviderPatientTabularExport(
  patientId: string,
  providerId: string,
  tenantId: string,
  section: ProviderPatientExportSection,
): Promise<TabularExport | null> {
  const overview = await getProviderPatientOverview(patientId, providerId, tenantId);
  if (!overview) return null;
  return buildProviderPatientSectionTabularExport(overview, section);
}
