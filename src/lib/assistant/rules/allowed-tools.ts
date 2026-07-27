import "server-only";
import type { SessionUser } from "@/lib/session";
import { resolveAssistantRules } from "@/lib/assistant/rules/resolve";
import type { TenantRuleOverride } from "@/lib/assistant/rules/types";

/** Tools permitidas pelo motor de regras efetivo (global + nicho + tenant). */
export function getAllowedRuleTools(
  user: SessionUser,
  tenantOverrides?: readonly TenantRuleOverride[],
): Set<string> {
  const rules = resolveAssistantRules({
    niche: user.niche,
    tenantOverrides,
  });
  return new Set(rules.map((r) => r.tool));
}
