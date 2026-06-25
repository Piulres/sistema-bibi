import "server-only";
import { getPrisma } from "@/lib/db";
import { formatBRL } from "@/lib/pricing";
import { paymentGateway } from "@/lib/payments/payment-gateway";
import { recordTimelineEvent, TIMELINE_ACTIONS, TIMELINE_ENTITY_TYPES } from "@/lib/timeline";
import { dispatchWebhooks } from "@/lib/webhook-service";

/** Anula fatura FECHADA (não paga) e libera itens Pay Per Use para novo faturamento. */
export async function voidInvoice(input: {
  tenantId: string;
  invoiceId: string;
  createdBy: string;
  reason?: string;
}) {
  const prisma = await getPrisma();
  const invoice = await prisma.invoice.findFirst({
    where: { id: input.invoiceId, tenantId: input.tenantId },
    include: {
      patient: { select: { name: true } },
      items: { include: { usage: true } },
      payments: true,
    },
  });
  if (!invoice) return null;
  if (invoice.status === "PAGA") {
    return { error: "Fatura paga não pode ser anulada — use estorno formal" as const };
  }
  if (invoice.status === "ANULADA") {
    return { error: "Fatura já anulada" as const };
  }

  const pendingPix = invoice.payments.find((p) => p.status === "PENDING" && p.externalId);
  if (pendingPix?.externalId) {
    try {
      const provider = paymentGateway.getPixProvider();
      await provider.cancelCharge(pendingPix.externalId);
    } catch {
      // POC: segue com cancelamento local
    }
  }

  await prisma.$transaction(async (tx) => {
    const usageIds = invoice.items.map((i) => i.usageId).filter(Boolean) as string[];
    if (usageIds.length > 0) {
      await tx.procedureUsage.updateMany({
        where: { id: { in: usageIds } },
        data: { billed: false },
      });
    }
    await tx.payment.updateMany({
      where: { invoiceId: invoice.id, status: "PENDING" },
      data: { status: "CANCELLED" },
    });
    await tx.invoiceItem.deleteMany({ where: { invoiceId: invoice.id } });
    await tx.invoice.update({
      where: { id: invoice.id },
      data: { status: "ANULADA", total: 0 },
    });
  });

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.INVOICE,
    entityId: invoice.id,
    action: TIMELINE_ACTIONS.VOIDED,
    description: `Fatura anulada — ${invoice.patient.name} (${formatBRL(invoice.total)})${input.reason ? `: ${input.reason}` : ""}`,
    createdBy: input.createdBy,
    reversible: false,
  });

  void dispatchWebhooks({
    tenantId: input.tenantId,
    event: "ENTITY_REVERTED",
    data: { entityType: "Invoice", entityId: invoice.id, action: "VOIDED" },
  });

  return { ok: true as const, invoiceId: invoice.id };
}
