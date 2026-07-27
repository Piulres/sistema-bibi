import type { AssistantPlan, AssistantToolCall } from "@/lib/assistant/types";

export type HybridPlanSource = "gateway" | "rules" | "hybrid" | "fallback";

export type HybridPlan = AssistantPlan & {
  source: HybridPlanSource;
  rejectedTools?: string[];
};

export type RefineHybridPlanInput = {
  gatewayPlan: AssistantPlan;
  rulesPlan: AssistantPlan;
  /** Tools permitidas pelo motor de regras ∩ RBAC. Vazio = só fallback. */
  allowedToolNames: ReadonlySet<string>;
  rulesEnabled: boolean;
};

/** Mescla args: gateway prevalece; vazios cedem ao que as regras extrairam. */
export function mergeArgsPreferGateway(
  gatewayArgs: Record<string, unknown>,
  rulesArgs: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...rulesArgs, ...gatewayArgs };
  for (const [key, value] of Object.entries(gatewayArgs)) {
    if (value === undefined || value === null || value === "") {
      if (rulesArgs[key] !== undefined) out[key] = rulesArgs[key];
    }
  }
  return out;
}

/**
 * Tools permitidas no modo híbrido:
 * - regras ligadas → interseção regras × tools RBAC do usuário
 * - regras desligadas → todas as tools RBAC (só o LLM decide, sem oráculo de regras)
 */
export function collectAllowedToolNames(input: {
  availableToolNames: readonly string[];
  ruleToolNames: readonly string[];
  rulesEnabled: boolean;
}): Set<string> {
  const available = new Set(input.availableToolNames);
  if (!input.rulesEnabled) return available;

  const allowed = new Set<string>();
  for (const name of input.ruleToolNames) {
    if (available.has(name)) allowed.add(name);
  }
  return allowed;
}

/**
 * Fase 4 — LLM propõe; motor de regras valida/refina antes das tools.
 *
 * 1. Descarta tool calls do gateway fora do allowlist
 * 2. Se sobrar call válida, mescla args com o match de regras (quando houver)
 * 3. Se o gateway não propôs nada válido, usa o plano de regras (se ativo)
 * 4. Senão, devolve fallback textual
 */
export function refineHybridPlan(input: RefineHybridPlanInput): HybridPlan {
  const rejected: string[] = [];
  const gatewayCalls = input.gatewayPlan.toolCalls.filter((call) => {
    if (!input.allowedToolNames.has(call.name)) {
      rejected.push(call.name);
      return false;
    }
    return true;
  });

  if (gatewayCalls.length > 0) {
    const rulesByName = new Map(
      input.rulesPlan.toolCalls.map((call) => [call.name, call] as const),
    );
    const refined: AssistantToolCall[] = gatewayCalls.map((call) => {
      const rulesCall = rulesByName.get(call.name);
      if (!rulesCall) return call;
      return {
        name: call.name,
        arguments: mergeArgsPreferGateway(call.arguments, rulesCall.arguments),
      };
    });

    return {
      toolCalls: refined,
      fallback: input.gatewayPlan.fallback,
      source: rejected.length > 0 || refined.some((c) => rulesByName.has(c.name))
        ? "hybrid"
        : "gateway",
      rejectedTools: rejected.length > 0 ? rejected : undefined,
    };
  }

  if (input.rulesEnabled) {
    const rulesCalls = input.rulesPlan.toolCalls.filter((call) =>
      input.allowedToolNames.has(call.name),
    );
    if (rulesCalls.length > 0) {
      return {
        toolCalls: rulesCalls,
        fallback: input.rulesPlan.fallback,
        source: "rules",
        rejectedTools: rejected.length > 0 ? rejected : undefined,
      };
    }
  }

  return {
    toolCalls: [],
    fallback: input.gatewayPlan.fallback ?? input.rulesPlan.fallback,
    source: "fallback",
    rejectedTools: rejected.length > 0 ? rejected : undefined,
  };
}
