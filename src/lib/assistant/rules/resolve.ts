import "server-only";
import type { AssistantRuleDef, RuleResolutionContext, TenantRuleOverride } from "@/lib/assistant/rules/types";
import { globalRuleTemplates } from "@/lib/assistant/rules/templates";
import { nicheRuleOverrides } from "@/lib/assistant/rules/niche-overrides";

function normalizeTrigger(t: string): string {
  return t.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

function appendTriggers(base: readonly string[], extra: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of [...base, ...extra]) {
    const key = normalizeTrigger(t);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

function applyTenantOverride(
  rule: AssistantRuleDef,
  tenantOverride: TenantRuleOverride,
): AssistantRuleDef {
  let triggers = [...rule.triggers];
  if (tenantOverride.addTriggers?.length) {
    triggers = appendTriggers(triggers, tenantOverride.addTriggers);
  }
  if (tenantOverride.removeTriggers?.length) {
    const remove = new Set(tenantOverride.removeTriggers.map(normalizeTrigger));
    triggers = triggers.filter((t) => !remove.has(normalizeTrigger(t)));
  }
  return {
    ...rule,
    triggers,
    source: "tenant",
  };
}

/**
 * Mescla camadas: global → nicho → tenant.
 * Preserva entradas múltiplas por tool (mock-intents tem vários blocos por ferramenta).
 */
export function resolveAssistantRules(ctx: RuleResolutionContext): AssistantRuleDef[] {
  let rules: AssistantRuleDef[] = globalRuleTemplates().map((r) => ({ ...r }));

  for (const patch of nicheRuleOverrides(ctx.niche)) {
    let matched = false;
    rules = rules.map((rule) => {
      if (rule.tool !== patch.tool) return rule;
      matched = true;
      return {
        ...rule,
        triggers: appendTriggers(rule.triggers, patch.triggers),
        priority: Math.max(rule.priority ?? 0, patch.priority ?? 0) || rule.priority,
        source: "niche" as const,
        niche: ctx.niche,
      };
    });
    if (!matched) {
      rules.push({ ...patch });
    }
  }

  const tenantMap = new Map<string, TenantRuleOverride>();
  for (const o of ctx.tenantOverrides ?? []) {
    tenantMap.set(o.tool, o);
  }

  const disabledTools = new Set(
    [...tenantMap.values()].filter((o) => o.disabled).map((o) => o.tool),
  );

  rules = rules.filter((rule) => !disabledTools.has(rule.tool));

  return rules.map((rule) => {
    const tenantOverride = tenantMap.get(rule.tool);
    if (!tenantOverride || tenantOverride.disabled) return rule;
    if (!tenantOverride.addTriggers?.length && !tenantOverride.removeTriggers?.length) {
      return rule;
    }
    return applyTenantOverride(rule, tenantOverride);
  });
}

export function countRuleTriggers(rules: readonly AssistantRuleDef[]): number {
  const set = new Set<string>();
  for (const rule of rules) {
    for (const t of rule.triggers) {
      set.add(normalizeTrigger(t));
    }
  }
  return set.size;
}
