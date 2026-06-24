import "server-only";
import type { AssistantToolDefinition } from "@/lib/assistant/types";
import { hasInternoPermission } from "@/lib/interno-permissions";
import type { SessionUser } from "@/lib/session";

export class AssistantPermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssistantPermissionError";
  }
}

export function assertToolPermission(user: SessionUser, tool: AssistantToolDefinition): void {
  if (user.role !== "INTERNO") {
    throw new AssistantPermissionError("Assistente disponível apenas no portal interno nesta fase.");
  }
  if (!tool.requiredModule) return;
  if (!hasInternoPermission(user.role, user.internoProfile, tool.requiredModule)) {
    throw new AssistantPermissionError(`Sem permissão para a ação: ${tool.name}`);
  }
}

export function filterToolsForUser(
  tools: AssistantToolDefinition[],
  user: SessionUser,
): AssistantToolDefinition[] {
  if (user.role !== "INTERNO") return [];
  return tools.filter((tool) => {
    if (!tool.requiredModule) return true;
    return hasInternoPermission(user.role, user.internoProfile, tool.requiredModule);
  });
}
