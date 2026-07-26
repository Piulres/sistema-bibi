/** Passos visuais da jornada clínica Pay Per Use — usado pelo FlowStepper. */

export const CARE_JOURNEY_STEPS = [
  { id: "agendado", label: "Agendado" },
  { id: "confirmado", label: "Confirmado" },
  { id: "realizado", label: "Atendido" },
  { id: "faturado", label: "Faturado" },
  { id: "pago", label: "Pago" },
] as const;

export type CareJourneyStepId = (typeof CARE_JOURNEY_STEPS)[number]["id"];

export type CareJourneyBillingFlags = {
  hasUnbilledUsages: boolean;
  hasOpenInvoice: boolean;
  hasPaidInvoice: boolean;
};

/**
 * Deriva flags de faturamento a partir de usages (+ status de fatura vinculada).
 * Usado no atendimento do prestador para avançar o stepper além de "Atendido".
 */
export function deriveCareJourneyBilling(input: {
  usages: Array<{ billed: boolean; invoiceStatus?: string | null }>;
}): CareJourneyBillingFlags {
  const { usages } = input;
  const hasUnbilledUsages = usages.some((u) => !u.billed);
  const invoiceStatuses = usages
    .map((u) => u.invoiceStatus?.toUpperCase())
    .filter((s): s is string => Boolean(s));

  const hasPaidInvoice = invoiceStatuses.some((s) => s === "PAGA");
  const hasOpenInvoice =
    invoiceStatuses.some((s) => s !== "PAGA") ||
    // Usage marcado billed sem link de fatura ainda conta como faturado em aberto
    (!hasUnbilledUsages &&
      usages.length > 0 &&
      usages.every((u) => u.billed) &&
      !hasPaidInvoice &&
      invoiceStatuses.length === 0);

  return { hasUnbilledUsages, hasOpenInvoice, hasPaidInvoice };
}

/** Mapeia status de agendamento + contexto para o passo atual da jornada. */
export function resolveCareJourneyStep(input: {
  appointmentStatus?: string | null;
  hasUnbilledUsages?: boolean;
  hasOpenInvoice?: boolean;
  hasPaidInvoice?: boolean;
}): CareJourneyStepId {
  const status = input.appointmentStatus?.toUpperCase();
  if (input.hasPaidInvoice) return "pago";
  if (input.hasOpenInvoice) return "faturado";
  if (status === "REALIZADO" || input.hasUnbilledUsages) return "realizado";
  if (status === "CONFIRMADO") return "confirmado";
  return "agendado";
}
