import "server-only";
import type { AssistantPlan } from "@/lib/assistant/types";
import type { SessionUser } from "@/lib/session";
import { toolBlockedByRules } from "@/lib/assistant/humanize";
import { resolveAssistantRules } from "@/lib/assistant/rules/resolve";
import type { TenantRuleOverride } from "@/lib/assistant/rules/types";

export type RefineAiPlanInput = {
  gatewayPlan: AssistantPlan;
  user: SessionUser;
  tenantOverrides?: readonly TenantRuleOverride[];
  allowedToolNames: ReadonlySet<string>;
};

export type RefineAiPlanResult = {
  plan: AssistantPlan;
  /** Quantidade de tool calls removidas pelo motor de regras. */
  filteredCount: number;
};

/**
 * Valida e filtra o plano do gateway (Fase 4 — IA híbrida).
 * LLM propõe tools → motor de regras aplica disabled, roles e catálogo efetivo.
 */
export function refineAiPlan(input: RefineAiPlanInput): RefineAiPlanResult {
  const rules = resolveAssistantRules({
    niche: input.user.niche,
    tenantOverrides: input.tenantOverrides,
  });

  const disabledTools = new Set(
    (input.tenantOverrides ?? []).filter((o) => o.disabled).map((o) => o.tool),
  );

  const rulesByTool = new Map<string, typeof rules>();
  for (const rule of rules) {
    const bucket = rulesByTool.get(rule.tool) ?? [];
    bucket.push(rule);
    rulesByTool.set(rule.tool, bucket);
  }

  const allowedByRules = new Set(rules.map((r) => r.tool));
  const userRole = input.user.role;

  function isToolAllowed(tool: string): boolean {
    if (!input.allowedToolNames.has(tool)) return false;
    if (disabledTools.has(tool)) return false;
    if (!allowedByRules.has(tool)) return false;
    const toolRules = rulesByTool.get(tool) ?? [];
    return toolRules.some((r) => !r.roles || r.roles.includes(userRole));
  }

  const original = input.gatewayPlan.toolCalls;
  const filtered = original.filter((call) => isToolAllowed(call.name));
  const filteredCount = original.length - filtered.length;

  if (filtered.length > 0) {
    return { plan: { toolCalls: filtered }, filteredCount };
  }

  if (original.length > 0) {
    return {
      plan: { toolCalls: [], fallback: toolBlockedByRules() },
      filteredCount,
    };
  }

  return { plan: input.gatewayPlan, filteredCount: 0 };
}
