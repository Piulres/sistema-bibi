/** Classes Tailwind para badges de status reutilizaveis no design system. */

export const appointmentStatusClass: Record<string, string> = {
  AGENDADO: "bg-[var(--status-neutral-bg)] text-[var(--status-neutral-text)]",
  CONFIRMADO: "bg-[var(--status-info-bg)] text-[var(--status-info-text)]",
  REALIZADO: "bg-[var(--status-success-bg)] text-[var(--status-success-text)]",
  FALTOU: "bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]",
  CANCELADO: "bg-[var(--status-danger-bg)] text-[var(--status-danger-text)]",
};

export const invoiceStatusClass: Record<string, string> = {
  FECHADA: "bg-[var(--status-info-bg)] text-[var(--status-info-text)]",
  PAGA: "bg-[var(--status-success-bg)] text-[var(--status-success-text)]",
  ABERTA: "bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]",
};

export const companyStatusClass: Record<string, string> = {
  LEAD: "bg-[var(--status-neutral-bg)] text-[var(--status-neutral-text)]",
  PROPOSTA: "bg-[var(--status-info-bg)] text-[var(--status-info-text)]",
  NEGOCIACAO: "bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]",
  ATIVO: "bg-[var(--status-success-bg)] text-[var(--status-success-text)]",
  INADIMPLENTE: "bg-[var(--status-danger-bg)] text-[var(--status-danger-text)]",
  CANCELADO: "bg-[var(--status-neutral-bg)] text-[var(--status-neutral-text)]",
};

export const subscriptionStatusClass: Record<string, string> = {
  ATIVA: "bg-[var(--status-success-bg)] text-[var(--status-success-text)]",
  SUSPENSA: "bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]",
  CANCELADA: "bg-[var(--status-danger-bg)] text-[var(--status-danger-text)]",
  PENDENTE: "bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]",
};

export const timelineActionClass: Record<string, string> = {
  CREATED: "bg-[var(--status-neutral-bg)] text-[var(--status-neutral-text)]",
  UPDATED: "bg-[var(--status-neutral-bg)] text-[var(--status-neutral-text)]",
  APPOINTMENT_COMPLETED: "bg-[var(--status-success-bg)] text-[var(--status-success-text)]",
  PROCEDURE_REGISTERED: "bg-[var(--status-info-bg)] text-[var(--status-info-text)]",
  MEDICAL_RECORD_CREATED: "bg-[var(--status-brand-bg)] text-[var(--status-brand-text)]",
  INVOICE_GENERATED: "bg-[var(--status-info-bg)] text-[var(--status-info-text)]",
  INVOICE_PAID: "bg-[var(--status-success-bg)] text-[var(--status-success-text)]",
  INVOICE_ISSUED: "bg-[var(--status-info-bg)] text-[var(--status-info-text)]",
  CHARGE_SENT: "bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]",
  CONTRACT_CHANGED: "bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]",
  SUBSCRIPTION_CREATED: "bg-[var(--status-info-bg)] text-[var(--status-info-text)]",
  SUBSCRIPTION_CHARGES_GENERATED: "bg-[var(--status-info-bg)] text-[var(--status-info-text)]",
  MESSAGE_QUEUED: "bg-[var(--status-info-bg)] text-[var(--status-info-text)]",
  MESSAGE_SENT: "bg-[var(--status-brand-bg)] text-[var(--status-brand-text)]",
  MESSAGE_FAILED: "bg-[var(--status-danger-bg)] text-[var(--status-danger-text)]",
  LOGIN: "bg-[var(--status-info-bg)] text-[var(--status-info-text)]",
};

export function statusBadgeClass(
  map: Record<string, string>,
  value: string,
): string {
  return map[value] ?? "bg-[var(--status-neutral-bg)] text-[var(--status-neutral-text)]";
}
