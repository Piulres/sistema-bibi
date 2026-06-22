import "server-only";
import { getPrisma } from "@/lib/db";
import { getTenantBranding } from "@/lib/theme/branding";
import {
  buildInvoicePdfBuffer,
  formatBRL,
  invoiceStatusLabel,
  type InvoiceExportData,
} from "@/lib/exports/invoice-pdf";

const dateTime = (value: Date) =>
  value.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/** Carrega fatura com itens e pagamento PIX pendente para exportação. */
export async function fetchInvoiceExportData(
  tenantId: string,
  invoiceId: string,
  scope?: { companyId?: string; patientId?: string },
): Promise<InvoiceExportData | null> {
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
      payments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!invoice) return null;

  const branding = await getTenantBranding(tenantId);
  const pendingPix = invoice.payments.find(
    (payment) =>
      payment.method === "PIX" &&
      payment.status === "PENDING" &&
      payment.pixCopyPaste,
  );

  return {
    clinicName: branding.displayName,
    platformLabel: branding.platformLabel,
    invoice: {
      id: invoice.id,
      createdAtLabel: dateTime(invoice.createdAt),
      status: invoiceStatusLabel(invoice.status),
      totalLabel: formatBRL(invoice.total),
      patientName: invoice.patient.name,
      companyName: invoice.company?.name ?? null,
      items: invoice.items.map((item) => ({
        description: item.description,
        amountLabel: formatBRL(item.amount),
      })),
    },
    payment: pendingPix
      ? {
          method: pendingPix.method,
          pixCopyPaste: pendingPix.pixCopyPaste,
          status: pendingPix.status,
        }
      : null,
  };
}

export async function buildInvoiceExportPdf(
  tenantId: string,
  invoiceId: string,
  scope?: { companyId?: string; patientId?: string },
): Promise<Buffer | null> {
  const data = await fetchInvoiceExportData(tenantId, invoiceId, scope);
  if (!data) return null;
  return buildInvoicePdfBuffer(data);
}
