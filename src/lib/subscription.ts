import { formatBRL } from "@/lib/pricing";

/** Status da assinatura recorrente. */
export const SUBSCRIPTION_STATUSES = [
  { value: "ATIVA", label: "Ativa" },
  { value: "SUSPENSA", label: "Suspensa" },
  { value: "CANCELADA", label: "Cancelada" },
] as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number]["value"];

/** Ciclo de cobrança. */
export const BILLING_CYCLES = [
  { value: "MENSAL", label: "Mensal", months: 1 },
  { value: "TRIMESTRAL", label: "Trimestral", months: 3 },
  { value: "SEMESTRAL", label: "Semestral", months: 6 },
  { value: "ANUAL", label: "Anual", months: 12 },
] as const;

export type BillingCycle = (typeof BILLING_CYCLES)[number]["value"];

export const SUBSCRIPTION_CHARGE_STATUSES = ["PENDENTE", "FATURADA", "CANCELADA"] as const;

export type SubscriptionChargeStatus = (typeof SUBSCRIPTION_CHARGE_STATUSES)[number];

const STATUS_SET = new Set<string>(SUBSCRIPTION_STATUSES.map((s) => s.value));
const CYCLE_SET = new Set<string>(BILLING_CYCLES.map((c) => c.value));

export function isSubscriptionStatus(value: string): value is SubscriptionStatus {
  return STATUS_SET.has(value);
}

export function isBillingCycle(value: string): value is BillingCycle {
  return CYCLE_SET.has(value);
}

export function subscriptionStatusLabel(status: string): string {
  return SUBSCRIPTION_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export function billingCycleLabel(cycle: string): string {
  return BILLING_CYCLES.find((c) => c.value === cycle)?.label ?? cycle;
}

export function monthsForBillingCycle(cycle: string): number {
  return BILLING_CYCLES.find((c) => c.value === cycle)?.months ?? 1;
}

/** Calcula datas de vencimento futuras dentro do horizonte. */
export function computeUpcomingDueDates(input: {
  billingCycle: string;
  startDate: Date;
  endDate: Date | null;
  horizonMonths?: number;
  existingDueDates?: Date[];
}): Date[] {
  const step = monthsForBillingCycle(input.billingCycle);
  const horizon = input.horizonMonths ?? 12;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const limit = new Date(today);
  limit.setMonth(limit.getMonth() + horizon);

  const end =
    input.endDate && input.endDate < limit ? input.endDate : limit;

  const existing = new Set(
    (input.existingDueDates ?? []).map((d) => d.toISOString().slice(0, 10)),
  );

  const cursor = new Date(input.startDate);
  cursor.setHours(0, 0, 0, 0);

  while (cursor < today) {
    cursor.setMonth(cursor.getMonth() + step);
  }

  const dates: Date[] = [];

  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10);
    if (!existing.has(key)) {
      dates.push(new Date(cursor));
    }
    cursor.setMonth(cursor.getMonth() + step);
  }

  return dates;
}

export function formatSubscriptionAmount(amount: number): string {
  return formatBRL(amount);
}
