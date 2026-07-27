import type { AssistantPlan, AssistantToolCall, AssistantToolDefinition } from "@/lib/assistant/types";
import type { TenantRuleOverride } from "@/lib/assistant/rules/types";

/**
 * Fase 4 — validação do plano LLM contra tools permitidas.
 * Interseção: tools do registry do usuário ∩ não desabilitadas por ruleOverrides.
 */
export function allowedToolsAfterOverrides(
  toolNames: readonly string[],
  tenantOverrides?: readonly TenantRuleOverride[],
): Set<string> {
  const disabled = new Set(
    (tenantOverrides ?? []).filter((o) => o.disabled).map((o) => o.tool),
  );
  return new Set(toolNames.filter((name) => !disabled.has(name)));
}

export function filterToolsForOverrides(
  tools: readonly AssistantToolDefinition[],
  tenantOverrides?: readonly TenantRuleOverride[],
): AssistantToolDefinition[] {
  const allowed = allowedToolsAfterOverrides(
    tools.map((t) => t.name),
    tenantOverrides,
  );
  return tools.filter((t) => allowed.has(t.name));
}

export type RefineGatewayPlanResult = {
  plan: AssistantPlan;
  dropped: string[];
  refined: boolean;
};

/**
 * Valida/refina plano do gateway: remove tools desconhecidas ou desabilitadas pelo tenant.
 * Se sobrar vazio, devolve fallback — o runner pode então cair no motor de regras.
 */
export function refineGatewayPlan(
  plan: AssistantPlan,
  allowedToolNames: Set<string>,
): RefineGatewayPlanResult {
  if (plan.toolCalls.length === 0) {
    return { plan, dropped: [], refined: false };
  }

  const kept: AssistantToolCall[] = [];
  const dropped: string[] = [];
  for (const call of plan.toolCalls) {
    if (allowedToolNames.has(call.name)) kept.push(call);
    else dropped.push(call.name);
  }

  if (dropped.length === 0) {
    return { plan, dropped: [], refined: false };
  }

  if (kept.length === 0) {
    return {
      plan: {
        toolCalls: [],
        fallback:
          plan.fallback?.trim() ||
          "A solicitação não pôde ser atendida com as ferramentas permitidas neste tenant. Reformule ou use o modo de regras.",
      },
      dropped,
      refined: true,
    };
  }

  return {
    plan: { toolCalls: kept, fallback: plan.fallback },
    dropped,
    refined: true,
  };
}
