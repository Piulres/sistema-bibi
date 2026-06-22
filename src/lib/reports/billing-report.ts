import "server-only";
import { getPrisma } from "@/lib/db";
import { formatBRL } from "@/lib/pricing";

function csvEscape(value: string | number | null | undefined): string {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Relatório CSV de faturamento e procedimentos pendentes. */
export async function buildBillingReportCsv(tenantId: string): Promise<string> {
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
    }),
  ]);

  const lines: string[] = [
    "tipo,beneficiario,empresa,descricao,valor,status,data",
  ];

  for (const inv of invoices) {
    lines.push(
      [
        "fatura",
        csvEscape(inv.patient.name),
        csvEscape(inv.company?.name ?? "Particular"),
        csvEscape("Fatura consolidada"),
        csvEscape(formatBRL(inv.total)),
        csvEscape(inv.status),
        csvEscape(inv.createdAt.toISOString()),
      ].join(","),
    );
  }

  for (const usage of pendingUsages) {
    const patient = usage.appointment.patient;
    lines.push(
      [
        "pendente",
        csvEscape(patient.name),
        csvEscape(patient.company?.name ?? "Particular"),
        csvEscape(usage.procedure.name),
        csvEscape(formatBRL(usage.priceCharged)),
        csvEscape("NAO_FATURADO"),
        csvEscape(usage.performedAt.toISOString()),
      ].join(","),
    );
  }

  return lines.join("\n");
}

/** Relatório CSV do pipeline CRM. */
export async function buildCrmReportCsv(tenantId: string): Promise<string> {
  const prisma = await getPrisma();
  const companies = await prisma.company.findMany({
    where: { tenantId },
    include: { _count: { select: { patients: true, invoices: true } } },
    orderBy: { name: "asc" },
  });

  const lines = ["empresa,cnpj,status,contrato_ativo,beneficiarios,faturas"];
  for (const c of companies) {
    lines.push(
      [
        csvEscape(c.name),
        csvEscape(c.cnpj),
        csvEscape(c.status),
        csvEscape(c.contractActive ? "SIM" : "NAO"),
        csvEscape(c._count.patients),
        csvEscape(c._count.invoices),
      ].join(","),
    );
  }
  return lines.join("\n");
}
