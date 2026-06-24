import "server-only";
import { getPrisma } from "@/lib/db";
import { formatBRL } from "@/lib/pricing";
import { dayRange, formatDateLabel, parseAssistantDate, toIsoDate } from "@/lib/assistant/dates";

export type RevenueSummary = {
  from: string;
  to: string;
  fromLabel: string;
  toLabel: string;
  invoicedTotal: number;
  invoicedTotalLabel: string;
  paidTotal: number;
  paidTotalLabel: string;
  openTotal: number;
  openTotalLabel: string;
  pendingPayPerUse: number;
  pendingPayPerUseLabel: string;
  invoiceCount: number;
};

export async function getRevenueSummary(
  tenantId: string,
  fromInput?: string,
  toInput?: string,
): Promise<RevenueSummary> {
  const prisma = await getPrisma();
  const fromDate = parseAssistantDate(fromInput);
  const toDate = parseAssistantDate(toInput ?? fromInput ?? "hoje");
  const from = dayRange(fromDate).from;
  const to = dayRange(toDate).to;

  const [invoices, pendingUsages] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        tenantId,
        createdAt: { gte: from, lte: to },
      },
    }),
    prisma.procedureUsage.findMany({
      where: {
        billed: false,
        performedAt: { gte: from, lte: to },
        appointment: { tenantId },
      },
    }),
  ]);

  const invoicedTotal = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const paidTotal = invoices
    .filter((inv) => inv.status === "PAGA")
    .reduce((sum, inv) => sum + inv.total, 0);
  const openTotal = invoices
    .filter((inv) => inv.status === "ABERTA" || inv.status === "FECHADA")
    .reduce((sum, inv) => sum + inv.total, 0);
  const pendingPayPerUse = pendingUsages.reduce((sum, u) => sum + u.priceCharged, 0);

  return {
    from: toIsoDate(fromDate),
    to: toIsoDate(toDate),
    fromLabel: formatDateLabel(fromDate),
    toLabel: formatDateLabel(toDate),
    invoicedTotal,
    invoicedTotalLabel: formatBRL(invoicedTotal),
    paidTotal,
    paidTotalLabel: formatBRL(paidTotal),
    openTotal,
    openTotalLabel: formatBRL(openTotal),
    pendingPayPerUse,
    pendingPayPerUseLabel: formatBRL(pendingPayPerUse),
    invoiceCount: invoices.length,
  };
}
