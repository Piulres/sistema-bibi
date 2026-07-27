import "server-only";
import { getPrisma } from "@/lib/db";
import type { TenantRuleOverride } from "@/lib/assistant/rules/types";
import { parseTenantRuleOverrides } from "@/lib/assistant/rules/tenant-overrides";

/** Configurações operacionais do tenant (realm). */
export type TenantAssistantSettings = {
  /** Add-on: chat com IA (gateway). Default false. */
  aiEnabled: boolean;
  /** Motor de regras configurável. Default true. */
  rulesEnabled: boolean;
  /** Overrides de gatilhos por tool (Fase 3). */
  ruleOverrides?: TenantRuleOverride[];
};

export type TenantSettings = {
  assistant: TenantAssistantSettings;
};

export const DEFAULT_TENANT_SETTINGS: TenantSettings = {
  assistant: {
    aiEnabled: false,
    rulesEnabled: true,
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Parse seguro de Tenant.settings (JSON). */
export function parseTenantSettings(raw: string | null | undefined): TenantSettings {
  if (!raw?.trim()) return { ...DEFAULT_TENANT_SETTINGS, assistant: { ...DEFAULT_TENANT_SETTINGS.assistant } };
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) return { ...DEFAULT_TENANT_SETTINGS, assistant: { ...DEFAULT_TENANT_SETTINGS.assistant } };
    const assistantRaw = parsed.assistant;
    const assistant: TenantAssistantSettings = { ...DEFAULT_TENANT_SETTINGS.assistant };
    if (isRecord(assistantRaw)) {
      if (typeof assistantRaw.aiEnabled === "boolean") assistant.aiEnabled = assistantRaw.aiEnabled;
      if (typeof assistantRaw.rulesEnabled === "boolean") assistant.rulesEnabled = assistantRaw.rulesEnabled;
      const overrides = parseTenantRuleOverrides(assistantRaw.ruleOverrides);
      if (overrides.length > 0) assistant.ruleOverrides = overrides;
    }
    return { assistant };
  } catch {
    return { ...DEFAULT_TENANT_SETTINGS, assistant: { ...DEFAULT_TENANT_SETTINGS.assistant } };
  }
}

export function serializeTenantSettings(settings: TenantSettings): string {
  return JSON.stringify(settings);
}

/** Mescla patch parcial sobre settings atuais. */
export function mergeTenantSettings(
  current: TenantSettings,
  patch: Partial<{ assistant: Partial<TenantAssistantSettings> }>,
): TenantSettings {
  return {
    assistant: {
      ...current.assistant,
      ...patch.assistant,
    },
  };
}

export async function getTenantSettings(tenantId: string): Promise<TenantSettings> {
  const prisma = await getPrisma();
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  });
  return parseTenantSettings(tenant?.settings);
}

export async function updateTenantSettings(
  tenantId: string,
  patch: Partial<{ assistant: Partial<TenantAssistantSettings> }>,
): Promise<TenantSettings> {
  const prisma = await getPrisma();
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  });
  const merged = mergeTenantSettings(parseTenantSettings(tenant?.settings), patch);
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { settings: serializeTenantSettings(merged) },
  });
  return merged;
}
