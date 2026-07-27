import "server-only";
import type {
  AssistantChatResult,
  AssistantMessage,
} from "@/lib/assistant/types";
import { isDraftToolResult } from "@/lib/assistant/types";
import type { SessionUser } from "@/lib/session";
import { resolveAssistantMode } from "@/lib/assistant/mode";
import { getTenantSettings } from "@/lib/tenant/settings";
import { shouldUseAssistantGateway } from "@/lib/assistant/plan-gateway";
import { buildAssistantSystemPrompt } from "@/lib/assistant/context";
import { buildActions, formatToolResult } from "@/lib/assistant/format";
import {
  hybridUnauthorizedTools,
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
  collectAllowedToolNames,
  refineHybridPlan,
} from "@/lib/assistant/provider/hybrid";
import { resolveAssistantIntents } from "@/lib/assistant/rules/engine";
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
  const mode = resolveAssistantMode(settings);
  const rulesEnabled = settings.assistant.rulesEnabled !== false;
  const ruleOverrides = settings.assistant.ruleOverrides;
  const ruleIntents = resolveAssistantIntents(user, ruleOverrides);
  const allowedToolNames = collectAllowedToolNames({
    availableToolNames: tools.map((t) => t.name),
    ruleToolNames: ruleIntents.map((i) => i.tool),
    rulesEnabled,
  });

  if (shouldUseAssistantGateway(mode)) {
    try {
      const gatewayPlan = await planGatewayAssistant(systemPrompt, messages, tools);
      const rulesPlan = rulesEnabled
        ? planMockAssistant(messages, tools, user, ruleOverrides)
        : { toolCalls: [] };
      const hybrid = refineHybridPlan({
        gatewayPlan,
        rulesPlan,
        allowedToolNames,
        rulesEnabled,
      });

      if (
        hybrid.toolCalls.length === 0 &&
        hybrid.rejectedTools?.length &&
        !hybrid.fallback
      ) {
        return {
          toolCalls: [],
          fallback: hybridUnauthorizedTools(hybrid.rejectedTools),
        };
      }
      return hybrid;
    } catch (error) {
      console.error("[assistant] gateway fallback to rules/mock:", error);
    }
  }
  if (!rulesEnabled) {
    return { toolCalls: [], fallback: rulesEngineDisabled() };
  }
  return planMockAssistant(messages, tools, user, ruleOverrides);
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

  const ruleIntents = resolveAssistantIntents(input.user, settings.assistant.ruleOverrides);
  const allowedToolNames = [
    ...collectAllowedToolNames({
      availableToolNames: tools.map((t) => t.name),
      ruleToolNames: ruleIntents.map((i) => i.tool),
      rulesEnabled: settings.assistant.rulesEnabled !== false,
    }),
  ];
  const systemPrompt = buildAssistantSystemPrompt(input.user, {
    pageContext: input.pageContext,
    mode,
    allowedToolNames: mode === "ai" ? allowedToolNames : undefined,
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
