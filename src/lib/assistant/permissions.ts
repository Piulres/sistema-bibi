import "server-only";
import type { AssistantToolDefinition } from "@/lib/assistant/types";
import { hasInternoPermission, isInternoAdmin } from "@/lib/interno-permissions";
import type { SessionUser } from "@/lib/session";

export class AssistantPermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssistantPermissionError";
  }
}

export function assertToolPermission(user: SessionUser, tool: AssistantToolDefinition): void {
  if (tool.requiredRoles && !tool.requiredRoles.includes(user.role)) {
    throw new AssistantPermissionError("Ação não disponível neste portal.");
  }
  if (user.role === "INTERNO" && tool.requiredInternoAdmin) {
    if (!isInternoAdmin(user.role, user.internoProfile)) {
      throw new AssistantPermissionError("Somente administradores podem executar esta ação.");
    }
  }
  if (user.role === "INTERNO" && tool.requiredModule) {
    if (!hasInternoPermission(user.role, user.internoProfile, tool.requiredModule)) {
      throw new AssistantPermissionError(`Sem permissão para a ação: ${tool.name}`);
    }
  }
}
