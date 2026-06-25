import "server-only";
import type {
  AssistantChatResult,
  AssistantMessage,
} from "@/lib/assistant/types";
import { isDraftToolResult } from "@/lib/assistant/types";
import type { SessionUser } from "@/lib/session";
import { resolveAssistantProvider } from "@/lib/assistant/config";
import { buildAssistantSystemPrompt } from "@/lib/assistant/context";
import { buildActions, formatToolResult } from "@/lib/assistant/format";
import {
  runnerEmptyResult,
  runnerFallback,
  runnerUnavailable,
  toolExecutionError,
} from "@/lib/assistant/humanize";
import { assertToolPermission, AssistantPermissionError } from "@/lib/assistant/permissions";
import { planGatewayAssistant } from "@/lib/assistant/provider/gateway";
import { planMockAssistant } from "@/lib/assistant/provider/mock";
import { findTool, getToolsForUser } from "@/lib/assistant/tools/registry";
import {
  clearOperationDraft,
  rememberOperationDraft,
  rememberPendingChoice,
  clearPendingChoice,
} from "@/lib/assistant/provider/mock-context";
import { isDraftToolName } from "@/lib/assistant/provider/mock-draft-flow";
import { isChoiceDraftResult } from "@/lib/assistant/types";

async function resolvePlan(
  user: SessionUser,
  messages: AssistantMessage[],
  tools: ReturnType<typeof getToolsForUser>,
  systemPrompt: string,
) {
  const provider = resolveAssistantProvider();
  if (provider === "gateway") {
    try {
      return await planGatewayAssistant(systemPrompt, messages, tools);
    } catch (error) {
      console.error("[assistant] gateway fallback to mock:", error);
    }
  }
  return planMockAssistant(messages, tools, user);
}

export async function runAssistantChat(input: {
  user: SessionUser;
  messages: AssistantMessage[];
  pageContext?: string;
}): Promise<AssistantChatResult> {
  const tools = getToolsForUser(input.user);
  const ctx = { user: input.user, labels: input.user.labels };

  if (tools.length === 0) {
    return {
      message: { role: "assistant", content: runnerUnavailable() },
    };
  }

  const systemPrompt = buildAssistantSystemPrompt(input.user, input.pageContext);
  const plan = await resolvePlan(input.user, input.messages, tools, systemPrompt);

  if (plan.toolCalls.length === 0) {
    return {
      message: { role: "assistant", content: plan.fallback ?? runnerFallback() },
    };
  }

  const trace: AssistantChatResult["toolTrace"] = [];
  const sections: string[] = [];
  let actions: AssistantChatResult["actions"] = [];
  let pendingActionId: string | undefined;

  for (const call of plan.toolCalls) {
    const tool = findTool(tools, call.name);
    if (!tool) {
      trace?.push({ name: call.name, ok: false, error: "Ferramenta indisponível" });
      continue;
    }

    try {
      assertToolPermission(input.user, tool);
      const result = await tool.handler(ctx, call.arguments);
      trace?.push({ name: call.name, ok: true });

      if (isDraftToolResult(result)) {
        pendingActionId = result.pendingActionId;
        clearOperationDraft(input.user.id);
        clearPendingChoice(input.user.id);
      } else if (isChoiceDraftResult(result)) {
        rememberPendingChoice(input.user.id, {
          tool: result.tool,
          field: result.field,
          fieldLabel: result.fieldLabel,
          options: result.options,
          draftArgs: result.draftArgs,
        });
        rememberOperationDraft(input.user.id, result.tool, result.draftArgs);
      } else if (
        isDraftToolName(call.name) &&
        typeof result === "object" &&
        result !== null &&
        "error" in result
      ) {
        rememberOperationDraft(input.user.id, call.name, call.arguments);
      }

      const formatted = formatToolResult(call.name, result, input.user.labels);
      sections.push(formatted ?? JSON.stringify(result, null, 2));
      actions = [...(actions ?? []), ...buildActions(call.name, result, input.user.role, input.user.labels)];
    } catch (error) {
      const message =
        error instanceof AssistantPermissionError
          ? error.message
          : toolExecutionError();
      trace?.push({ name: call.name, ok: false, error: message });
      sections.push(message);
    }
  }

  return {
    message: {
      role: "assistant",
      content: sections.join("\n\n") || runnerEmptyResult(),
    },
    actions: actions?.length ? actions : undefined,
    pendingActionId,
    toolTrace: process.env.NODE_ENV === "development" ? trace : undefined,
  };
}
