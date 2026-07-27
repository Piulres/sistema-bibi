import type { TenantRuleOverride } from "@/lib/assistant/rules/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeTriggerList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const trimmed = item.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

/** Parse seguro de overrides de regras em Tenant.settings.assistant.ruleOverrides. */
export function parseTenantRuleOverrides(raw: unknown): TenantRuleOverride[] {
  if (!Array.isArray(raw)) return [];
  const byTool = new Map<string, TenantRuleOverride>();
  for (const item of raw) {
    if (!isRecord(item) || typeof item.tool !== "string" || !item.tool.trim()) continue;
    const tool = item.tool.trim();
    const override: TenantRuleOverride = { tool };
    if (typeof item.disabled === "boolean") override.disabled = item.disabled;
    const addTriggers = normalizeTriggerList(item.addTriggers);
    const removeTriggers = normalizeTriggerList(item.removeTriggers);
    if (addTriggers.length > 0) override.addTriggers = addTriggers;
    if (removeTriggers.length > 0) override.removeTriggers = removeTriggers;
    byTool.set(tool, override);
  }
  return normalizeTenantRuleOverrides([...byTool.values()]);
}

/** Remove overrides vazios (sem efeito) e ordena por tool. */
export function normalizeTenantRuleOverrides(
  overrides: readonly TenantRuleOverride[],
): TenantRuleOverride[] {
  return overrides
    .filter(
      (o) =>
        Boolean(o.tool?.trim()) &&
        (o.disabled === true ||
          (o.addTriggers?.length ?? 0) > 0 ||
          (o.removeTriggers?.length ?? 0) > 0),
    )
    .map((o) => {
      const next: TenantRuleOverride = { tool: o.tool.trim() };
      if (o.disabled === true) next.disabled = true;
      if (o.addTriggers?.length) next.addTriggers = [...o.addTriggers];
      if (o.removeTriggers?.length) next.removeTriggers = [...o.removeTriggers];
      return next;
    })
    .sort((a, b) => a.tool.localeCompare(b.tool));
}
