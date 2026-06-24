import "server-only";

/** Feature flag — desligar com ASSISTANT_ENABLED=false */
export function isAssistantEnabled(): boolean {
  return process.env.ASSISTANT_ENABLED !== "false";
}

export type AssistantProviderKind = "mock" | "gateway";

export function isGatewayConfigured(): boolean {
  return Boolean(process.env.OPENAI_BASE_URL?.trim() && process.env.OPENAI_API_KEY?.trim());
}

/** Resolve provider efetivo — gateway só se configurado. */
export function resolveAssistantProvider(): AssistantProviderKind {
  const preferred = process.env.ASSISTANT_PROVIDER?.trim().toLowerCase();
  if (preferred === "netlify-gateway" && isGatewayConfigured()) return "gateway";
  if (preferred === "gateway" && isGatewayConfigured()) return "gateway";
  return "mock";
}

export function getAssistantModel(): string {
  return process.env.ASSISTANT_MODEL?.trim() || "gpt-4o-mini";
}
