export const MEDICATION_STATUSES = ["ATIVA", "SUSPENSA", "ENCERRADA"] as const;
export type MedicationStatus = (typeof MEDICATION_STATUSES)[number];

export {
  PRESCRIPTION_KINDS,
  isPrescriptionKind,
  prescriptionKindLabel,
  prescriptionKindHint,
  type PrescriptionKind,
} from "@/lib/clinical/receita";

export {
  ATESTADO_KINDS,
  isAtestadoKind,
  atestadoKindLabel,
  type AtestadoKind,
} from "@/lib/clinical/atestado";

export {
  REFERRAL_KINDS,
  REFERRAL_URGENCIES,
  REFERRAL_TEMPLATES,
  isReferralKind,
  isReferralUrgency,
  referralKindLabel,
  referralUrgencyLabel,
  referralStatusLabel,
  buildEncaminhamentoDocument,
  type ReferralKind,
  type ReferralUrgency,
  type ReferralTemplate,
} from "@/lib/clinical/encaminhamento";

export const EXAM_ORDER_STATUSES = [
  "SOLICITADO",
  "AGENDADO",
  "REALIZADO",
  "LAUDADO",
  "CANCELADO",
] as const;
export type ExamOrderStatus = (typeof EXAM_ORDER_STATUSES)[number];

export const PROTOCOL_ENROLLMENT_STATUSES = ["ATIVO", "CONCLUIDO", "SUSPENSO"] as const;
export type ProtocolEnrollmentStatus = (typeof PROTOCOL_ENROLLMENT_STATUSES)[number];

export const VACCINE_STATUSES = ["APLICADA", "PENDENTE", "VENCIDA"] as const;
export type VaccineStatus = (typeof VACCINE_STATUSES)[number];

export type AllergyEntry = {
  substance: string;
  severity?: string;
  notes?: string;
};

export type ChronicConditionEntry = {
  condition: string;
  since?: string;
  notes?: string;
};

export type ProtocolChecklistItem = {
  id: string;
  label: string;
  required?: boolean;
};

/** Item de um protocolo de exames (painel reutilizável). */
export type ExamProtocolItem = {
  id: string;
  examName: string;
  procedureId?: string | null;
};

export function parseJsonArray<T>(value: string | null | undefined): T[] {
  if (!value?.trim()) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function parseJsonObject(value: string | null | undefined): Record<string, boolean> {
  if (!value?.trim()) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, boolean>)
      : {};
  } catch {
    return {};
  }
}

export function examOrderStatusLabel(status: string): string {
  switch (status) {
    case "SOLICITADO":
      return "Solicitado";
    case "AGENDADO":
      return "Agendado";
    case "REALIZADO":
      return "Realizado";
    case "LAUDADO":
      return "Laudado";
    case "CANCELADO":
      return "Cancelado";
    default:
      return status;
  }
}

export function medicationStatusLabel(status: string): string {
  switch (status) {
    case "ATIVA":
      return "Ativa";
    case "SUSPENSA":
      return "Suspensa";
    case "ENCERRADA":
      return "Encerrada";
    default:
      return status;
  }
}

export function protocolStatusLabel(status: string): string {
  switch (status) {
    case "ATIVO":
      return "Ativo";
    case "CONCLUIDO":
      return "Concluído";
    case "SUSPENSO":
      return "Suspenso";
    default:
      return status;
  }
}

export function vaccineStatusLabel(status: string): string {
  switch (status) {
    case "APLICADA":
      return "Aplicada";
    case "PENDENTE":
      return "Pendente";
    case "VENCIDA":
      return "Vencida";
    default:
      return status;
  }
}
