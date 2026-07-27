import type { InternoProfile } from "@/lib/interno-permissions";
import { ASSISTANT_TOOL_INVENTORY } from "@/lib/assistant/inventory";

const TOOL_BY_NAME = new Map(ASSISTANT_TOOL_INVENTORY.map((t) => [t.name, t]));

/** Rótulo legível para tools do inventário (UI admin + preview). */
export function getAssistantToolLabel(name: string): string {
  return TOOL_BY_NAME.get(name)?.description ?? humanizeToolName(name);
}

export function getAssistantToolMeta(name: string) {
  return TOOL_BY_NAME.get(name);
}

function humanizeToolName(name: string): string {
  return name
    .replace(/^draft_/, "")
    .replace(/^get_/, "")
    .replace(/^list_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const ROLE_LABELS: Record<string, string> = {
  PRESTADOR: "Prestador",
  INTERNO: "Interno",
  PJ: "Empresa (PJ)",
  BENEFICIARIO: "Beneficiário",
};

const INTERNO_PROFILE_LABELS: Record<InternoProfile, string> = {
  ADMIN: "Administrador",
  FATURAMENTO: "Faturamento",
  RECEPCAO: "Recepção",
  READONLY: "Somente leitura",
};

export function formatAssignableRoleLabel(role: string): string {
  return ROLE_LABELS[role.toUpperCase()] ?? role;
}

export function formatInternoProfileLabel(profile: string): string {
  const key = profile.toUpperCase() as InternoProfile;
  return INTERNO_PROFILE_LABELS[key] ?? profile;
}

/** Capitaliza rótulo de campo em cards de escolha do chat. */
export function formatChoiceFieldTitle(fieldLabel: string): string {
  const trimmed = fieldLabel.trim();
  if (!trimmed) return "Escolha uma opção";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}
