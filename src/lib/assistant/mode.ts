import "server-only";
import { isGatewayConfigured } from "@/lib/assistant/config";
import type { TenantSettings } from "@/lib/tenant/settings";

/** Modo efetivo do assistente para um tenant. */
export type AssistantMode = "rules" | "ai";

/**
 * Resolve modo do assistente a partir das settings do realm.
 * IA só ativa com flag no tenant + gateway configurado no ambiente.
 */
export function resolveAssistantMode(settings: TenantSettings): AssistantMode {
  if (settings.assistant.aiEnabled && isGatewayConfigured()) return "ai";
  return "rules";
}

export function assistantModeLabel(mode: AssistantMode): string {
  return mode === "ai" ? "IA (gateway)" : "Regras operacionais";
}
