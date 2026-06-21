/** Status do pipeline CRM corporativo (evolução de Company). */
export const COMPANY_STATUSES = [
  { value: "LEAD", label: "Lead", columnClass: "border-slate-200 bg-slate-50" },
  { value: "PROPOSTA", label: "Proposta", columnClass: "border-sky-200 bg-sky-50" },
  { value: "NEGOCIACAO", label: "Negociação", columnClass: "border-amber-200 bg-amber-50" },
  { value: "ATIVO", label: "Ativo", columnClass: "border-emerald-200 bg-emerald-50" },
  { value: "INADIMPLENTE", label: "Inadimplente", columnClass: "border-orange-200 bg-orange-50" },
  { value: "CANCELADO", label: "Cancelado", columnClass: "border-red-200 bg-red-50" },
] as const;

export type CompanyStatus = (typeof COMPANY_STATUSES)[number]["value"];

const STATUS_VALUES = new Set<string>(COMPANY_STATUSES.map((s) => s.value));

export function isCompanyStatus(value: string): value is CompanyStatus {
  return STATUS_VALUES.has(value);
}

export function companyStatusLabel(status: string): string {
  return COMPANY_STATUSES.find((s) => s.value === status)?.label ?? status;
}

/** Mantém contractActive alinhado ao status (compatibilidade com Portal PJ). */
export function contractActiveFromStatus(status: string): boolean {
  return status === "ATIVO" || status === "INADIMPLENTE";
}

export function columnClassForStatus(status: string): string {
  return (
    COMPANY_STATUSES.find((s) => s.value === status)?.columnClass ??
    "border-slate-200 bg-slate-50"
  );
}
