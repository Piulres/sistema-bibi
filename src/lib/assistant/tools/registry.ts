import "server-only";
import type { AssistantToolDefinition } from "@/lib/assistant/types";
import { internoReadTools } from "@/lib/assistant/tools/interno/read";
import type { SessionUser } from "@/lib/session";
import { filterToolsForUser } from "@/lib/assistant/permissions";

export function getToolsForUser(user: SessionUser): AssistantToolDefinition[] {
  if (user.role === "INTERNO") {
    return filterToolsForUser(internoReadTools, user);
  }
  return [];
}

export function findTool(
  tools: AssistantToolDefinition[],
  name: string,
): AssistantToolDefinition | undefined {
  return tools.find((tool) => tool.name === name);
}
