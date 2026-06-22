import "server-only";
import { getPrisma } from "@/lib/db";
import { formatBRL } from "@/lib/pricing";
import { bootstrapPaymentGateway } from "@/lib/payments/bootstrap";
import { createPixCharge, isPaymentGatewayConfigured } from "@/lib/payments/charge-service";
import { billingCycleLabel } from "@/lib/subscription";
import {
  recordTimelineEvent,
  TIMELINE_ACTIONS,
  TIMELINE_ENTITY_TYPES,
} from "@/lib/timeline";

bootstrapPaymentGateway();

const dateOnly = (value: Date) =>
  value.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

export type PaymentView = {
  id: string;
  method: string;
  amount: number;
  amountLabel: string;
  status: string;
  gatewayId: string | null;
  externalId: string | null;
  pixCopyPaste: string | null;
  paidAt: string | null;
  paidAtLabel: string | null;
  createdAt: string;
};

function mapPayment(payment: {
  id: string;
  method: string;
  amount: number;
  status: string;
  gatewayId: string | null;
  externalId: string | null;
  pixCopyPaste: string | null;
  paidAt: Date | null;
  createdAt: Date;
}): PaymentView {
  return {
    id: payment.id,
    method: payment.method,
    amount: payment.amount,
    amountLabel: formatBRL(payment.amount),
    status: payment.status,
    gatewayId: payment.gatewayId,
    externalId: payment.externalId,
    pixCopyPaste: payment.pixCopyPaste,
    paidAt: payment.paidAt?.toISOString() ?? null,
    paidAtLabel: payment.paidAt
      ? payment.paidAt.toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null,
    createdAt: payment.createdAt.toISOString(),
  };
}

/** Converte cobrança de assinatura pendente em fatura FECHADA. */
export async function invoiceSubscriptionCharge(input: {
  tenantId: string;
  chargeId: string;
  createdBy: string;
}) {
  const prisma = await getPrisma();
  const charge = await prisma.subscriptionCharge.findFirst({
    where: {
      id: input.chargeId,
      status: "PENDENTE",
      invoiceId: null,
      subscription: { tenantId: input.tenantId },
    },
    include: {
      subscription: {
        include: {
          patient: true,
          company: true,
        },
      },
    },
  });

  if (!charge) return null;

  const { subscription } = charge;
  const description = `Assinatura ${billingCycleLabel(subscription.billingCycle).toLowerCase()} — venc. ${dateOnly(charge.dueDate)}`;

  const invoice = await prisma.$transaction(async (tx) => {
    const created = await tx.invoice.create({
      data: {
        tenantId: input.tenantId,
        patientId: subscription.patientId,
        companyId: subscription.companyId,
        total: charge.amount,
        status: "FECHADA",
        items: {
          create: {
            description,
            amount: charge.amount,
            subscriptionChargeId: charge.id,
          },
        },
      },
    });

    await tx.subscriptionCharge.update({
      where: { id: charge.id },
      data: { status: "FATURADA", invoiceId: created.id },
    });

    await recordTimelineEvent(
      {
        tenantId: input.tenantId,
        entityType: TIMELINE_ENTITY_TYPES.INVOICE,
        entityId: created.id,
        action: TIMELINE_ACTIONS.INVOICE_ISSUED,
        description: `Fatura de assinatura emitida para ${subscription.patient.name} (${formatBRL(created.total)})`,
        createdBy: input.createdBy,
      },
      tx,
    );

    return created;
  });

  return {
    invoice: {
      id: invoice.id,
      total: invoice.total,
      totalLabel: formatBRL(invoice.total),
      status: invoice.status,
    },
  };
}

/** Marca fatura FECHADA como PAGA e registra histórico de pagamento. */
export async function markInvoicePaid(input: {
  tenantId: string;
  invoiceId: string;
  method: string;
  createdBy: string;
  externalId?: string | null;
  gatewayId?: string | null;
  paymentId?: string | null;
}) {
  const prisma = await getPrisma();
  const invoice = await prisma.invoice.findFirst({
    where: { id: input.invoiceId, tenantId: input.tenantId },
    include: { patient: true, payments: true },
  });

  if (!invoice) return null;
  if (invoice.status === "PAGA") {
    return { error: "Fatura já está paga" as const };
  }
  if (invoice.status !== "FECHADA") {
    return { error: "Somente faturas FECHADA podem ser pagas" as const };
  }

  const result = await prisma.$transaction(async (tx) => {
    let payment;

    if (input.paymentId) {
      payment = await tx.payment.findFirst({
        where: { id: input.paymentId, invoiceId: invoice.id, status: "PENDING" },
      });
      if (!payment) return { error: "Pagamento PIX pendente não encontrado" as const };

      payment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "CONFIRMED",
          paidAt: new Date(),
        },
      });
    } else {
      payment = await tx.payment.create({
        data: {
          invoiceId: invoice.id,
          method: input.method,
          amount: invoice.total,
          status: "CONFIRMED",
          gatewayId: input.gatewayId ?? null,
          externalId: input.externalId ?? null,
          paidAt: new Date(),
          createdBy: input.createdBy,
        },
      });
    }

    await tx.invoice.update({
      where: { id: invoice.id },
      data: { status: "PAGA" },
    });

    await recordTimelineEvent(
      {
        tenantId: input.tenantId,
        entityType: TIMELINE_ENTITY_TYPES.INVOICE,
        entityId: invoice.id,
        action: TIMELINE_ACTIONS.INVOICE_PAID,
        description: `Fatura paga (${input.method}) — ${invoice.patient.name} (${formatBRL(invoice.total)})`,
        createdBy: input.createdBy,
      },
      tx,
    );

    return { payment: mapPayment(payment) };
  });

  return result;
}

/** Gera cobrança PIX para fatura FECHADA (adapter mock ou real). */
export async function createInvoicePixCharge(input: {
  tenantId: string;
  invoiceId: string;
  createdBy: string;
}) {
  const prisma = await getPrisma();
  if (!isPaymentGatewayConfigured()) {
    return { error: "Gateway de pagamento não configurado (defina PAYMENT_GATEWAY=mock)" as const };
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: input.invoiceId, tenantId: input.tenantId },
    include: { patient: true, payments: true },
  });

  if (!invoice) return null;
  if (invoice.status !== "FECHADA") {
    return { error: "Somente faturas FECHADA podem receber cobrança PIX" as const };
  }

  const pendingPix = invoice.payments.find(
    (p) => p.method === "PIX" && p.status === "PENDING" && p.pixCopyPaste,
  );
  if (pendingPix) {
    return {
      payment: mapPayment(pendingPix),
      reused: true,
    };
  }

  const pixResult = await createPixCharge({
    reference: {
      tenantId: input.tenantId,
      invoiceId: invoice.id,
      patientId: invoice.patientId,
      companyId: invoice.companyId,
    },
    amount: { amount: invoice.total, currency: "BRL" },
    payer: {
      name: invoice.patient.name,
      cpfCnpj: invoice.patient.cpf,
      phone: invoice.patient.phone ?? undefined,
    },
    description: `Fatura Bibi — ${invoice.patient.name}`,
  });

  const payment = await prisma.$transaction(async (tx) => {
    const created = await tx.payment.create({
      data: {
        invoiceId: invoice.id,
        method: "PIX",
        amount: invoice.total,
        status: "PENDING",
        gatewayId: pixResult.gatewayId,
        externalId: pixResult.externalId,
        pixCopyPaste: pixResult.pixCopyPaste,
        qrCodePayload: pixResult.qrCodePayload,
        createdBy: input.createdBy,
      },
    });

    await recordTimelineEvent(
      {
        tenantId: input.tenantId,
        entityType: TIMELINE_ENTITY_TYPES.INVOICE,
        entityId: invoice.id,
        action: TIMELINE_ACTIONS.CHARGE_SENT,
        description: `Cobrança PIX gerada para ${invoice.patient.name} (${formatBRL(invoice.total)})`,
        createdBy: input.createdBy,
      },
      tx,
    );

    return created;
  });

  return {
    payment: mapPayment(payment),
    pixCopyPaste: pixResult.pixCopyPaste,
    qrCodePayload: pixResult.qrCodePayload,
    expiresAt: pixResult.expiresAt?.toISOString() ?? null,
  };
}

/** Confirma pagamento PIX pendente (simula webhook do gateway mock). */
export async function confirmInvoicePixPayment(input: {
  tenantId: string;
  invoiceId: string;
  paymentId: string;
  createdBy: string;
}) {
  const prisma = await getPrisma();
  const payment = await prisma.payment.findFirst({
    where: {
      id: input.paymentId,
      invoiceId: input.invoiceId,
      method: "PIX",
      status: "PENDING",
      invoice: { tenantId: input.tenantId },
    },
  });

  if (!payment) return null;

  return markInvoicePaid({
    tenantId: input.tenantId,
    invoiceId: input.invoiceId,
    method: "PIX",
    createdBy: input.createdBy,
    paymentId: payment.id,
    gatewayId: payment.gatewayId,
    externalId: payment.externalId,
  });
}

export async function listInvoicePayments(invoiceId: string, tenantId: string) {
  const prisma = await getPrisma();
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, tenantId },
  });
  if (!invoice) return null;

  const payments = await prisma.payment.findMany({
    where: { invoiceId },
    orderBy: { createdAt: "desc" },
  });

  return payments.map(mapPayment);
}
