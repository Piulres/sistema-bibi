import "server-only";
import { isGatewayConfigured } from "@/lib/assistant/config";
import type { AssistantMode } from "@/lib/assistant/mode";

/** Gateway ativo quando modo IA + env configurado (ASSISTANT_PROVIDER=mock força mock em dev). */
export function shouldUseAssistantGateway(mode: AssistantMode): boolean {
  if (mode !== "ai" || !isGatewayConfigured()) return false;
  const preferred = process.env.ASSISTANT_PROVIDER?.trim().toLowerCase();
  if (preferred === "mock") return false;
  return true;
}
