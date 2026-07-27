import "server-only";
import type { AssistantMessage, AssistantPlan, AssistantToolDefinition } from "@/lib/assistant/types";
import type { SessionUser } from "@/lib/session";
import { planMockFromIntents } from "@/lib/assistant/provider/mock-match";
import type { TenantRuleOverride } from "@/lib/assistant/rules/types";
import { allowedToolsAfterOverrides } from "@/lib/assistant/hybrid";

/**
 * Provider mock — roteamento por catálogo de intenções (centenas de gatilhos).
 * Substitui LLM em dev/POC; fallback automático quando gateway indisponível.
 * Aplica `ruleOverrides` do tenant em runtime (Fase 3/4).
 */
export function planMockAssistant(
  messages: AssistantMessage[],
  tools: AssistantToolDefinition[],
  user: SessionUser,
  tenantOverrides?: readonly TenantRuleOverride[],
): AssistantPlan {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const raw = lastUser?.content ?? "";
  const toolNames = allowedToolsAfterOverrides(
    tools.map((t) => t.name),
    tenantOverrides,
  );
  return planMockFromIntents(raw, user, toolNames, tenantOverrides);
}
