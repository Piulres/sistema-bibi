import "server-only";
import type {
  AssistantChatResult,
  AssistantMessage,
} from "@/lib/assistant/types";
import { isDraftToolResult } from "@/lib/assistant/types";
import type { SessionUser } from "@/lib/session";
import { resolveAssistantProvider } from "@/lib/assistant/config";
import { resolveAssistantMode } from "@/lib/assistant/mode";
import { getTenantSettings } from "@/lib/tenant/settings";
import { buildAssistantSystemPrompt } from "@/lib/assistant/context";
import { buildActions, formatToolResult } from "@/lib/assistant/format";
import {
  runnerEmptyResult,
  runnerFallback,
  runnerUnavailable,
  rulesEngineDisabled,
  toolExecutionError,
} from "@/lib/assistant/humanize";
import { assertToolPermission, AssistantPermissionError } from "@/lib/assistant/permissions";
import { planGatewayAssistant } from "@/lib/assistant/provider/gateway";
import { planMockAssistant } from "@/lib/assistant/provider/mock";
import {
  allowedToolsAfterOverrides,
  filterToolsForOverrides,
  refineGatewayPlan,
} from "@/lib/assistant/hybrid";
import { findTool, getToolsForUser } from "@/lib/assistant/tools/registry";
import {
  clearOperationDraft,
  rememberOperationDraft,
  rememberPendingChoice,
  clearPendingChoice,
  exportMockContext,
  applyMockContext,
  clearMockContext,
} from "@/lib/assistant/provider/mock-context";
import { isDraftToolName } from "@/lib/assistant/provider/mock-draft-flow";
import { isChoiceDraftResult } from "@/lib/assistant/types";
import {
  decodeAssistantSessionState,
  encodeAssistantSessionState,
} from "@/lib/assistant/session-state";
import { recordAssistantToolUse } from "@/lib/assistant/analytics";

async function resolvePlan(
  user: SessionUser,
  messages: AssistantMessage[],
  tools: ReturnType<typeof getToolsForUser>,
  systemPrompt: string,
) {
  const settings = await getTenantSettings(user.tenantId);
  const overrides = settings.assistant.ruleOverrides;
  const mode = resolveAssistantMode(settings);
  const provider = resolveAssistantProvider();
  const allowed = allowedToolsAfterOverrides(
    tools.map((t) => t.name),
    overrides,
  );
  const toolsForPlan = filterToolsForOverrides(tools, overrides);

  if (mode === "ai" && provider === "gateway") {
    try {
      // Pipeline híbrido: LLM interpreta → regras validam/refinam → tools
      const llmPlan = await planGatewayAssistant(systemPrompt, messages, toolsForPlan);
      const { plan: refined } = refineGatewayPlan(llmPlan, allowed);
      if (refined.toolCalls.length > 0) return refined;
      // Plano vazio após refine: tenta motor de regras se habilitado
      if (!settings.assistant.rulesEnabled) return refined;
    } catch (error) {
      console.error("[assistant] gateway fallback to mock:", error);
    }
  }
  if (!settings.assistant.rulesEnabled) {
    return { toolCalls: [], fallback: rulesEngineDisabled() };
  }
  return planMockAssistant(messages, tools, user, overrides);
}

export async function runAssistantChat(input: {
  user: SessionUser;
  messages: AssistantMessage[];
  pageContext?: string;
  sessionState?: string;
}): Promise<AssistantChatResult> {
  const tools = getToolsForUser(input.user);
  const ctx = { user: input.user, labels: input.user.labels };
  const settings = await getTenantSettings(input.user.tenantId);

  if (tools.length === 0) {
    return {
      message: { role: "assistant", content: runnerUnavailable() },
    };
  }

  clearMockContext(input.user.id);
  const restored = decodeAssistantSessionState(input.sessionState, input.user.id);
  if (restored) {
    applyMockContext(input.user.id, {
      lastIntent: restored.lastIntent,
      operationDraft: restored.operationDraft,
      pendingChoice: restored.pendingChoice,
    });
  }

  const mode = resolveAssistantMode(settings);
  if (!settings.assistant.rulesEnabled && mode !== "ai") {
    return {
      message: { role: "assistant", content: rulesEngineDisabled() },
    };
  }

  const disabledTools = (settings.assistant.ruleOverrides ?? [])
    .filter((o) => o.disabled)
    .map((o) => o.tool);
  const systemPrompt = buildAssistantSystemPrompt(input.user, input.pageContext, {
    disabledTools,
  });
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
      void recordAssistantToolUse(input.user, call.name, true, input.pageContext);

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
      void recordAssistantToolUse(input.user, call.name, false, input.pageContext);
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
    sessionState: encodeAssistantSessionState(input.user.id, exportMockContext(input.user.id)),
  };
}
