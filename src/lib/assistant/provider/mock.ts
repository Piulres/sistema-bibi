import "server-only";
import type { AssistantMessage, AssistantPlan, AssistantToolDefinition } from "@/lib/assistant/types";
import type { SessionUser } from "@/lib/session";
import { planMockFromIntents } from "@/lib/assistant/provider/mock-match";

/**
 * Provider mock — roteamento por catálogo de intenções (centenas de gatilhos).
 * Substitui LLM em dev/POC; fallback automático quando gateway indisponível.
 */
export function planMockAssistant(
  messages: AssistantMessage[],
  tools: AssistantToolDefinition[],
  user: SessionUser,
): AssistantPlan {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const raw = lastUser?.content ?? "";
  const toolNames = new Set(tools.map((t) => t.name));
  return planMockFromIntents(raw, user, toolNames);
}
