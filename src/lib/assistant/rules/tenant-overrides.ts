import type { TenantRuleOverride } from "@/lib/assistant/rules/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Parse seguro de overrides de regras em Tenant.settings.assistant.ruleOverrides. */
export function parseTenantRuleOverrides(raw: unknown): TenantRuleOverride[] {
  if (!Array.isArray(raw)) return [];
  const result: TenantRuleOverride[] = [];
  for (const item of raw) {
    if (!isRecord(item) || typeof item.tool !== "string" || !item.tool.trim()) continue;
    const override: TenantRuleOverride = { tool: item.tool.trim() };
    if (typeof item.disabled === "boolean") override.disabled = item.disabled;
    if (Array.isArray(item.addTriggers)) {
      override.addTriggers = item.addTriggers.filter((t): t is string => typeof t === "string");
    }
    if (Array.isArray(item.removeTriggers)) {
      override.removeTriggers = item.removeTriggers.filter((t): t is string => typeof t === "string");
    }
    result.push(override);
  }
  return result;
}
