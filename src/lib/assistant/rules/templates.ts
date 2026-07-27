import "server-only";
import { MOCK_INTENTS, type MockIntentDef } from "@/lib/assistant/provider/mock-intents";
import type { AssistantRuleDef } from "@/lib/assistant/rules/types";

/** Converte catálogo global (mock-intents) em regras com id estável. */
export function globalRuleTemplates(): readonly AssistantRuleDef[] {
  return MOCK_INTENTS.map((intent, index) => mockIntentToRule(intent, index));
}

function mockIntentToRule(intent: MockIntentDef, index: number): AssistantRuleDef {
  return {
    id: `global:${intent.tool}:${index}`,
    tool: intent.tool,
    roles: intent.roles,
    triggers: intent.triggers,
    priority: intent.priority,
    special: intent.special,
    source: "global",
  };
}

/** Compatibilidade com mock-match (MockIntentDef). */
export function rulesToMockIntents(rules: readonly AssistantRuleDef[]): MockIntentDef[] {
  return rules.map(({ tool, roles, triggers, priority, special }) => ({
    tool,
    roles,
    triggers,
    priority,
    special,
  }));
}
