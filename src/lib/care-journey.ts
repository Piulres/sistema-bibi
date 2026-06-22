/** Passos visuais da jornada clínica Pay Per Use — usado pelo FlowStepper. */

export const CARE_JOURNEY_STEPS = [
  { id: "agendado", label: "Agendado" },
  { id: "confirmado", label: "Confirmado" },
  { id: "realizado", label: "Atendido" },
  { id: "faturado", label: "Faturado" },
  { id: "pago", label: "Pago" },
] as const;

export type CareJourneyStepId = (typeof CARE_JOURNEY_STEPS)[number]["id"];

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
