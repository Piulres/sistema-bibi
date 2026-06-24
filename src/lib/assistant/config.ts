import "server-only";

/** Feature flag — desligar com ASSISTANT_ENABLED=false */
export function isAssistantEnabled(): boolean {
  return process.env.ASSISTANT_ENABLED !== "false";
}

export function getAssistantProvider(): "mock" | "netlify-gateway" {
  const value = process.env.ASSISTANT_PROVIDER?.trim().toLowerCase();
  if (value === "netlify-gateway") return "netlify-gateway";
  return "mock";
}
