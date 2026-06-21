import "server-only";
import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/pricing";
import {
  billingCycleLabel,
  computeUpcomingDueDates,
  subscriptionStatusLabel,
} from "@/lib/subscription";
import {
  recordTimelineEvent,
  TIMELINE_ACTIONS,
  TIMELINE_ENTITY_TYPES,
} from "@/lib/timeline";

const dateOnly = (value: Date) =>
  value.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

export type SubscriptionView = {
  id: string;
  status: string;
  statusLabel: string;
  billingCycle: string;
  billingCycleLabel: string;
  startDate: string;
  startDateLabel: string;
  endDate: string | null;
  endDateLabel: string | null;
  amount: number;
  amountLabel: string;
  description: string | null;
  patientId: string;
  patientName: string;
  companyId: string | null;
  companyName: string | null;
  pendingCharges: number;
  nextDueDate: string | null;
  nextDueDateLabel: string | null;
};

function mapSubscription(sub: {
  id: string;
  status: string;
  billingCycle: string;
  startDate: Date;
  endDate: Date | null;
  amount: number;
  description: string | null;
  patientId: string;
  companyId: string | null;
  patient: { name: string };
  company: { name: string } | null;
  charges: { dueDate: Date; status: string }[];
}): SubscriptionView {
  const pending = sub.charges.filter((c) => c.status === "PENDENTE");
  const next = pending.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0];

  return {
    id: sub.id,
    status: sub.status,
    statusLabel: subscriptionStatusLabel(sub.status),
    billingCycle: sub.billingCycle,
    billingCycleLabel: billingCycleLabel(sub.billingCycle),
    startDate: sub.startDate.toISOString(),
    startDateLabel: dateOnly(sub.startDate),
    endDate: sub.endDate?.toISOString() ?? null,
    endDateLabel: sub.endDate ? dateOnly(sub.endDate) : null,
    amount: sub.amount,
    amountLabel: formatBRL(sub.amount),
    description: sub.description,
    patientId: sub.patientId,
    patientName: sub.patient.name,
    companyId: sub.companyId,
    companyName: sub.company?.name ?? null,
    pendingCharges: pending.length,
    nextDueDate: next?.dueDate.toISOString() ?? null,
    nextDueDateLabel: next ? dateOnly(next.dueDate) : null,
  };
}

export async function listSubscriptions(tenantId: string): Promise<SubscriptionView[]> {
  const rows = await prisma.subscription.findMany({
    where: { tenantId },
    include: {
      patient: { select: { name: true } },
      company: { select: { name: true } },
      charges: { select: { dueDate: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map(mapSubscription);
}

export async function listTenantPatientsForSubscription(tenantId: string) {
  return prisma.patient.findMany({
    where: { tenantId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function createSubscription(input: {
  tenantId: string;
  patientId: string;
  companyId?: string | null;
  status: string;
  billingCycle: string;
  startDate: Date;
  endDate?: Date | null;
  amount: number;
  description?: string | null;
  createdBy: string;
}) {
  const patient = await prisma.patient.findFirst({
    where: { id: input.patientId, tenantId: input.tenantId },
  });
  if (!patient) return null;

  const subscription = await prisma.subscription.create({
    data: {
      tenantId: input.tenantId,
      patientId: input.patientId,
      companyId: input.companyId ?? patient.companyId,
      status: input.status,
      billingCycle: input.billingCycle,
      startDate: input.startDate,
      endDate: input.endDate ?? null,
      amount: input.amount,
      description: input.description ?? null,
    },
    include: {
      patient: { select: { name: true } },
      company: { select: { name: true } },
      charges: { select: { dueDate: true, status: true } },
    },
  });

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.SUBSCRIPTION,
    entityId: subscription.id,
    action: TIMELINE_ACTIONS.CREATED,
    description: `Assinatura ${billingCycleLabel(subscription.billingCycle)} criada para ${subscription.patient.name}`,
    createdBy: input.createdBy,
  });

  return mapSubscription(subscription);
}

export async function updateSubscriptionStatus(input: {
  tenantId: string;
  subscriptionId: string;
  status: string;
  createdBy: string;
}) {
  const existing = await prisma.subscription.findFirst({
    where: { id: input.subscriptionId, tenantId: input.tenantId },
    include: { patient: { select: { name: true } } },
  });
  if (!existing) return null;

  const subscription = await prisma.subscription.update({
    where: { id: existing.id },
    data: { status: input.status },
    include: {
      patient: { select: { name: true } },
      company: { select: { name: true } },
      charges: { select: { dueDate: true, status: true } },
    },
  });

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.SUBSCRIPTION,
    entityId: subscription.id,
    action: TIMELINE_ACTIONS.UPDATED,
    description: `Assinatura de ${subscription.patient.name}: ${subscriptionStatusLabel(existing.status)} → ${subscriptionStatusLabel(input.status)}`,
    createdBy: input.createdBy,
  });

  return mapSubscription(subscription);
}

/** Gera cobranças futuras pendentes com base no ciclo da assinatura. */
export async function generateSubscriptionCharges(input: {
  tenantId: string;
  subscriptionId: string;
  horizonMonths?: number;
  createdBy: string;
}) {
  const subscription = await prisma.subscription.findFirst({
    where: { id: input.subscriptionId, tenantId: input.tenantId },
    include: {
      patient: { select: { name: true } },
      company: { select: { name: true } },
      charges: true,
    },
  });

  if (!subscription) return null;
  if (subscription.status !== "ATIVA") {
    return { error: "Assinatura precisa estar ATIVA para gerar cobranças" as const };
  }

  const existingDueDates = subscription.charges.map((c) => c.dueDate);
  const dueDates = computeUpcomingDueDates({
    billingCycle: subscription.billingCycle,
    startDate: subscription.startDate,
    endDate: subscription.endDate,
    horizonMonths: input.horizonMonths ?? 12,
    existingDueDates,
  });

  if (dueDates.length === 0) {
    return { error: "Não há cobranças futuras a gerar" as const };
  }

  await prisma.subscriptionCharge.createMany({
    data: dueDates.map((dueDate) => ({
      subscriptionId: subscription.id,
      dueDate,
      amount: subscription.amount,
      status: "PENDENTE",
    })),
  });

  await recordTimelineEvent({
    tenantId: input.tenantId,
    entityType: TIMELINE_ENTITY_TYPES.SUBSCRIPTION,
    entityId: subscription.id,
    action: TIMELINE_ACTIONS.SUBSCRIPTION_CHARGES_GENERATED,
    description: `${dueDates.length} cobrança(s) futura(s) geradas para ${subscription.patient.name} (${formatBRL(subscription.amount)}/${billingCycleLabel(subscription.billingCycle).toLowerCase()})`,
    createdBy: input.createdBy,
  });

  const updated = await prisma.subscription.findUniqueOrThrow({
    where: { id: subscription.id },
    include: {
      patient: { select: { name: true } },
      company: { select: { name: true } },
      charges: { select: { dueDate: true, status: true } },
    },
  });

  return {
    subscription: mapSubscription(updated),
    generatedCount: dueDates.length,
  };
}

export async function listSubscriptionCharges(subscriptionId: string, tenantId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: { id: subscriptionId, tenantId },
  });
  if (!subscription) return null;

  const charges = await prisma.subscriptionCharge.findMany({
    where: { subscriptionId },
    orderBy: { dueDate: "asc" },
  });

  return charges.map((charge) => ({
    id: charge.id,
    dueDate: charge.dueDate.toISOString(),
    dueDateLabel: dateOnly(charge.dueDate),
    amount: charge.amount,
    amountLabel: formatBRL(charge.amount),
    status: charge.status,
    invoiceId: charge.invoiceId,
  }));
}
