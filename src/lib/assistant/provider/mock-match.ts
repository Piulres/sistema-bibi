import "server-only";
import type { AssistantPlan, AssistantToolCall } from "@/lib/assistant/types";
import type { SessionUser } from "@/lib/session";
import {
  MOCK_INTENTS,
  SHARED,
  type MockIntentDef,
} from "@/lib/assistant/provider/mock-intents";
import {
  dateRangeFromText,
  defaultDateArg,
  extractCreateAppointmentArgs,
  extractCreatePatientArgs,
  extractCreateUserArgs,
  extractIncrementalArgs,
  extractSearchQuery,
  followUpDate,
  isDraftContinuation,
  isFollowUpPhrase,
  parseChoiceSelection,
} from "@/lib/assistant/provider/mock-extractors";
import {
  getLastIntent,
  getOperationDraft,
  getPendingChoice,
  rememberLastIntent,
  rememberOperationDraft,
  clearPendingChoice,
  clearMockContext,
} from "@/lib/assistant/provider/mock-context";
import {
  buildPortalHelpFallback,
  resolvePortalFollowUpTool,
} from "@/lib/assistant/portal-concepts";
import { formatChoiceQuestion } from "@/lib/assistant/resolve-entities";
import {
  isDraftToolName,
  mergeDraftArgs,
  stripDraftMeta,
} from "@/lib/assistant/provider/mock-draft-flow";
import {
  matchesAnyTrigger,
  normalizeMockText,
  scoreTriggers,
  splitCompositeQuery,
} from "@/lib/assistant/provider/mock-normalize";

function buildDefaultArgs(tool: string, raw: string, text: string): Record<string, unknown> {
  switch (tool) {
    case "count_appointments":
    case "list_my_appointments":
      return { date: defaultDateArg(text) };
    case "get_revenue_summary":
      return dateRangeFromText(text);
    case "list_debtors":
      return { limit: 15 };
    case "get_dashboard_kpis":
    case "get_prestador_dashboard":
    case "get_pj_overview":
    case "get_my_overview":
    case "get_open_invoices":
    case "list_my_invoices":
    case "list_users":
      return {};
    case "list_my_patients":
    case "list_company_beneficiaries": {
      const q = extractSearchQuery(raw);
      return q ? { search: q } : {};
    }
    case "search_patients": {
      const q = extractSearchQuery(raw);
      return q ? { query: q } : { query: raw.trim() };
    }
    case "explain_capability":
      return { topic: raw };
    case "get_extrato_summary":
      return { from: defaultDateArg(text) };
    case "list_available_slots":
      return { date: defaultDateArg(text) };
    case "draft_create_appointment":
    case "draft_book_appointment":
      return extractCreateAppointmentArgs(raw);
    default:
      return {};
  }
}

function intentAllowed(intent: MockIntentDef, role: string, toolNames: Set<string>): boolean {
  if (!toolNames.has(intent.tool)) return false;
  if (intent.roles && !intent.roles.includes(role)) return false;
  return true;
}

function matchSpecial(
  intent: MockIntentDef,
  raw: string,
): Record<string, unknown> | null {
  if (intent.special === "create_user") return extractCreateUserArgs(raw);
  if (intent.special === "create_patient") return extractCreatePatientArgs(raw);
  if (intent.special === "create_appointment") return extractCreateAppointmentArgs(raw);
  if (intent.special === "book_appointment") return extractCreateAppointmentArgs(raw);
  return {};
}

function rememberDraftFromCall(userId: string, call: AssistantToolCall): void {
  if (!isDraftToolName(call.name)) return;
  const existing = getOperationDraft(userId);
  const merged = mergeDraftArgs(existing?.args ?? {}, call.arguments);
  rememberOperationDraft(userId, call.name, merged);
}

function tryResolvePendingChoice(
  raw: string,
  user: SessionUser,
  toolNames: Set<string>,
): AssistantPlan | null {
  const pending = getPendingChoice(user.id);
  if (!pending || !toolNames.has(pending.tool)) return null;

  const selectedId = parseChoiceSelection(raw, pending.options);
  if (!selectedId) {
    return {
      toolCalls: [],
      fallback: [
        "Não identifiquei sua escolha.",
        formatChoiceQuestion(pending.fieldLabel, pending.options),
        "",
        "Responda com o **número** ou o **nome completo**.",
      ].join("\n"),
    };
  }

  const merged = mergeDraftArgs(pending.draftArgs, { [pending.field]: selectedId });
  clearPendingChoice(user.id);
  rememberOperationDraft(user.id, pending.tool, merged);
  rememberLastIntent(user.id, pending.tool);

  return {
    toolCalls: [{ name: pending.tool, arguments: stripDraftMeta(merged) }],
  };
}

function tryDraftContinuation(
  raw: string,
  user: SessionUser,
  toolNames: Set<string>,
  lastTool: string | null,
): AssistantToolCall | null {
  const activeDraft = getOperationDraft(user.id);
  const pendingChoice = getPendingChoice(user.id);
  if (!isDraftContinuation(raw, lastTool, Boolean(activeDraft), Boolean(pendingChoice))) {
    return null;
  }

  const tool =
    activeDraft?.tool ?? (lastTool && isDraftToolName(lastTool) ? lastTool : null);
  if (!tool || !toolNames.has(tool)) return null;

  const incoming = extractIncrementalArgs(tool, raw);
  const merged = mergeDraftArgs(activeDraft?.args ?? {}, incoming);
  rememberOperationDraft(user.id, tool, merged);
  rememberLastIntent(user.id, tool);

  return { name: tool, arguments: stripDraftMeta(merged) };
}

function matchIntentOnSegment(
  segment: string,
  rawSegment: string,
  user: SessionUser,
  toolNames: Set<string>,
  lastTool: string | null,
): AssistantToolCall | null {
  const text = normalizeMockText(segment);

  const draftContinuation = tryDraftContinuation(rawSegment, user, toolNames, lastTool);
  if (draftContinuation) return draftContinuation;

  if (isFollowUpPhrase(text) && lastTool && toolNames.has(lastTool) && !isDraftToolName(lastTool)) {
    const date = followUpDate(text);
    if (date || text.length < 20) {
      return {
        name: lastTool,
        arguments: buildDefaultArgs(lastTool, rawSegment, text || segment),
      };
    }
    const switched = resolvePortalFollowUpTool(user.role, text, lastTool);
    if (switched && toolNames.has(switched)) {
      return { name: switched, arguments: buildDefaultArgs(switched, rawSegment, text) };
    }
  }

  for (const intent of MOCK_INTENTS.filter((i) => i.special)) {
    if (!intentAllowed(intent, user.role, toolNames)) continue;
    if (!matchesAnyTrigger(text, intent.triggers)) continue;
    const args = matchSpecial(intent, rawSegment);
    if (args === null) continue;
    return { name: intent.tool, arguments: args };
  }

  if (
    toolNames.has("explain_capability") &&
    matchesAnyTrigger(text, SHARED.help) &&
    !/\b(como esta|como está|como andam)\b/.test(text) &&
    (/\b(como fazer|como criar|como cadastrar|como agendar|como faturar|onde |passo a passo|tutorial|manual|me ajuda)\b/.test(
      text,
    ) ||
      /^como\s+(faturar|agendar|cadastrar|criar|incluir|pagar)\b/.test(text))
  ) {
    return {
      name: "explain_capability",
      arguments: { topic: rawSegment.trim() },
    };
  }

  let best: { intent: MockIntentDef; score: number } | null = null;
  for (const intent of MOCK_INTENTS.filter((i) => !i.special)) {
    if (!intentAllowed(intent, user.role, toolNames)) continue;
    const score = scoreTriggers(text, intent.triggers) + (intent.priority ?? 0);
    if (score <= (intent.priority ?? 0)) continue;
    if (!best || score > best.score) best = { intent, score };
  }

  if (!best) return null;
  return {
    name: best.intent.tool,
    arguments: buildDefaultArgs(best.intent.tool, rawSegment, text),
  };
}

export function planMockFromIntents(
  raw: string,
  user: SessionUser,
  toolNames: Set<string>,
): AssistantPlan {
  if (!raw.trim()) {
    return {
      toolCalls: [],
      fallback: "Como posso ajudar? Use os atalhos abaixo ou descreva a operação.",
    };
  }

  const choicePlan = tryResolvePendingChoice(raw, user, toolNames);
  if (choicePlan) return choicePlan;

  const lastTool = getLastIntent(user.id);
  const segments = splitCompositeQuery(raw);
  const calls: AssistantToolCall[] = [];
  const seen = new Set<string>();

  for (const segment of segments) {
    const match = matchIntentOnSegment(segment, raw, user, toolNames, lastTool);
    if (match && !seen.has(match.name)) {
      calls.push(match);
      seen.add(match.name);
      rememberDraftFromCall(user.id, match);
    }
  }

  if (calls.length === 0) {
    const activeDraft = getOperationDraft(user.id);
    if (activeDraft && toolNames.has(activeDraft.tool)) {
      return {
        toolCalls: [
          {
            name: activeDraft.tool,
            arguments: stripDraftMeta(activeDraft.args),
          },
        ],
      };
    }
    return {
      toolCalls: [],
      fallback: buildPortalHelpFallback(user.role, user.labels, toolNames, activeDraft?.tool),
    };
  }

  for (const call of calls) rememberLastIntent(user.id, call.name);

  return { toolCalls: calls.slice(0, 4) };
}

export { clearMockContext };
