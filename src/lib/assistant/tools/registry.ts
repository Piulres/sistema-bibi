import "server-only";
import type { AssistantToolDefinition } from "@/lib/assistant/types";
import type { SessionUser } from "@/lib/session";
import { hasInternoPermission, isInternoAdmin } from "@/lib/interno-permissions";
import { internoReadTools } from "@/lib/assistant/tools/interno/read";
import { internoWriteTools } from "@/lib/assistant/tools/interno/write";
import { prestadorReadTools } from "@/lib/assistant/tools/prestador/read";
import { pjReadTools } from "@/lib/assistant/tools/pj/read";
import { beneficiarioReadTools } from "@/lib/assistant/tools/beneficiario/read";
import { explainCapabilityTool } from "@/lib/assistant/tools/shared/help";

export function getToolsForUser(user: SessionUser): AssistantToolDefinition[] {
  switch (user.role) {
    case "INTERNO":
      return filterToolsForUser(
        [...internoReadTools, ...internoWriteTools, explainCapabilityTool],
        user,
      );
    case "PRESTADOR":
      return filterToolsForUser([...prestadorReadTools, explainCapabilityTool], user);
    case "PJ":
      return filterToolsForUser([...pjReadTools, explainCapabilityTool], user);
    case "BENEFICIARIO":
      return filterToolsForUser([...beneficiarioReadTools, explainCapabilityTool], user);
    default:
      return [];
  }
}

export function filterToolsForUser(
  tools: AssistantToolDefinition[],
  user: SessionUser,
): AssistantToolDefinition[] {
  return tools.filter((tool) => {
    if (tool.requiredRoles && !tool.requiredRoles.includes(user.role)) return false;
    if (user.role === "INTERNO" && tool.requiredInternoAdmin) {
      if (!isInternoAdmin(user.role, user.internoProfile)) return false;
    }
    if (user.role === "INTERNO" && tool.requiredModule) {
      return hasInternoPermission(user.role, user.internoProfile, tool.requiredModule);
    }
    return true;
  });
}

export function findTool(
  tools: AssistantToolDefinition[],
  name: string,
): AssistantToolDefinition | undefined {
  return tools.find((tool) => tool.name === name);
}

export function toolsToOpenAiSchema(tools: AssistantToolDefinition[]) {
  return tools.map((tool) => ({
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}
