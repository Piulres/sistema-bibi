import "server-only";
import type { SessionUser } from "@/lib/session";
import type { MockIntentDef } from "@/lib/assistant/provider/mock-intents";
import { rulesToMockIntents } from "@/lib/assistant/rules/templates";
import { resolveAssistantRules, countRuleTriggers } from "@/lib/assistant/rules/resolve";
import type { RuleEngineStats, TenantRuleOverride } from "@/lib/assistant/rules/types";

/** Regras efetivas para o tenant/nicho do usuário (entrada do mock-match). */
export function resolveAssistantIntents(
  user: SessionUser,
  tenantOverrides?: readonly TenantRuleOverride[],
): MockIntentDef[] {
  const rules = resolveAssistantRules({
    niche: user.niche,
    tenantOverrides,
  });
  return rulesToMockIntents(rules);
}

/** Estatísticas para painel `/interno/assistente`. */
export function buildRuleEngineStats(
  niche: SessionUser["niche"],
  tenantOverrides?: readonly TenantRuleOverride[],
): RuleEngineStats {
  const rules = resolveAssistantRules({ niche, tenantOverrides });
  const globalRules = rules.filter((r) => r.source === "global").length;
  const nicheRules = rules.filter((r) => r.source === "niche").length;
  const tenantRules = rules.filter((r) => r.source === "tenant").length;

  return {
    globalRules,
    nicheRules,
    tenantOverrides: tenantRules,
    totalTriggers: countRuleTriggers(rules),
    niche,
  };
}

export { resolveAssistantRules, countRuleTriggers };
