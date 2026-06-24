import type { TimelineEventMetadata } from "@/lib/change-management/types";

/** Rótulos legíveis para campos comuns em diffs de auditoria. */
export const CHANGE_FIELD_LABELS: Record<string, string> = {
  name: "Nome",
  cpf: "CPF",
  cnpj: "CNPJ",
  birthDate: "Data de nascimento",
  phone: "Telefone",
  email: "E-mail",
  gender: "Gênero",
  motherName: "Nome da mãe",
  employeeId: "Matrícula",
  bondType: "Vínculo",
  companyId: "Empresa (ID)",
  companyName: "Empresa",
  tradeName: "Nome fantasia",
  contactName: "Contato",
  contactEmail: "E-mail do contato",
  contactPhone: "Telefone do contato",
  addressStreet: "Endereço",
  addressCity: "Cidade",
  addressState: "UF",
  addressZip: "CEP",
  status: "Status",
  contractActive: "Contrato ativo",
  multiplier: "Multiplicador",
  description: "Descrição",
  procedureId: "Procedimento (ID)",
  procedureCode: "Código do procedimento",
  procedureName: "Procedimento",
};

export function changeFieldLabel(field: string): string {
  return CHANGE_FIELD_LABELS[field] ?? field;
}

function stableValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/** Compara snapshots e produz metadata para a timeline. */
export function buildChangeMetadata(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): TimelineEventMetadata {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const fieldsChanged = [...keys].filter(
    (key) => stableValue(before[key]) !== stableValue(after[key]),
  );
  return { before, after, fieldsChanged };
}

export function buildDeleteMetadata(
  before: Record<string, unknown>,
): TimelineEventMetadata {
  return {
    before,
    fieldsChanged: Object.keys(before),
  };
}

export function serializeTimelineMetadata(metadata: TimelineEventMetadata): string {
  return JSON.stringify(metadata);
}

export function parseTimelineMetadata(
  raw: string | null | undefined,
): TimelineEventMetadata | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as TimelineEventMetadata;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function metadataHasDiff(metadata: TimelineEventMetadata | null): boolean {
  if (!metadata) return false;
  return (metadata.fieldsChanged?.length ?? 0) > 0;
}

export function formatMetadataValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
