import "server-only";
import type { AssistantPlan } from "@/lib/assistant/types";

/**
 * Valida plano do gateway contra regras efetivas + tools do usuário (Fase 4).
 * Retorna null quando todas as tool_calls foram rejeitadas (caller usa fallback mock).
 */
export function validateGatewayPlan(
  plan: AssistantPlan,
  allowedRuleTools: Set<string>,
  userToolNames: Set<string>,
): AssistantPlan | null {
  if (plan.toolCalls.length === 0) {
    return plan.fallback ? plan : null;
  }

  const validCalls = plan.toolCalls.filter(
    (call) => userToolNames.has(call.name) && allowedRuleTools.has(call.name),
  );

  if (validCalls.length === 0) return null;

  return {
    toolCalls: validCalls,
    fallback: plan.fallback,
  };
}
