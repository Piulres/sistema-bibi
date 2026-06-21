import "server-only";
import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/pricing";
import { getPatientOverview, type PatientOverviewData } from "@/lib/patient-overview";
import {
  billingCycleLabel,
  subscriptionStatusLabel,
} from "@/lib/subscription";

const dateOnly = (value: Date) =>
  value.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

export type BeneficiarySubscriptionView = {
  id: string;
  status: string;
  statusLabel: string;
  billingCycleLabel: string;
  amountLabel: string;
  description: string | null;
  pendingCharges: number;
  nextDueDateLabel: string | null;
  charges: {
    id: string;
    dueDateLabel: string;
    amountLabel: string;
    status: string;
  }[];
};

export type BeneficiaryOverviewData = PatientOverviewData & {
  subscriptions: BeneficiarySubscriptionView[];
  nextAppointment: PatientOverviewData["appointments"][number] | null;
};

/**
 * Visão self-service do beneficiário logado.
 * Reutiliza Cliente 360° com escopo fixo em patientId da sessão.
 */
export async function getBeneficiaryOverview(
  patientId: string,
  tenantId: string,
): Promise<BeneficiaryOverviewData | null> {
  const overview = await getPatientOverview(patientId, tenantId);
  if (!overview) return null;

  const subscriptions = await prisma.subscription.findMany({
    where: { patientId, tenantId },
    include: {
      charges: { orderBy: { dueDate: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const subscriptionViews: BeneficiarySubscriptionView[] = subscriptions.map((sub) => {
    const pending = sub.charges.filter((c) => c.status === "PENDENTE");
    const next = pending[0];

    return {
      id: sub.id,
      status: sub.status,
      statusLabel: subscriptionStatusLabel(sub.status),
      billingCycleLabel: billingCycleLabel(sub.billingCycle),
      amountLabel: formatBRL(sub.amount),
      description: sub.description,
      pendingCharges: pending.length,
      nextDueDateLabel: next ? dateOnly(next.dueDate) : null,
      charges: sub.charges.map((charge) => ({
        id: charge.id,
        dueDateLabel: dateOnly(charge.dueDate),
        amountLabel: formatBRL(charge.amount),
        status: charge.status,
      })),
    };
  });

  const upcoming = overview.appointments
    .filter((a) => ["AGENDADO", "CONFIRMADO"].includes(a.status))
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))[0] ?? null;

  return {
    ...overview,
    subscriptions: subscriptionViews,
    nextAppointment: upcoming,
  };
}
