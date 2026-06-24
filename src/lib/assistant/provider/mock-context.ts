import "server-only";

type LastIntent = {
  tool: string;
  at: number;
};

export type OperationDraft = {
  tool: string;
  args: Record<string, unknown>;
  at: number;
};

export type PendingChoice = {
  tool: string;
  field: string;
  fieldLabel: string;
  options: { id: string; label: string; detail?: string }[];
  draftArgs: Record<string, unknown>;
  at: number;
};

const TTL_MS = 15 * 60 * 1000;
const intentStore = new Map<string, LastIntent>();
const draftStore = new Map<string, OperationDraft>();
const choiceStore = new Map<string, PendingChoice>();

export function rememberLastIntent(userId: string, tool: string): void {
  intentStore.set(userId, { tool, at: Date.now() });
}

export function getLastIntent(userId: string): string | null {
  const item = intentStore.get(userId);
  if (!item) return null;
  if (Date.now() - item.at > TTL_MS) {
    intentStore.delete(userId);
    return null;
  }
  return item.tool;
}

export function getOperationDraft(userId: string): OperationDraft | null {
  const item = draftStore.get(userId);
  if (!item) return null;
  if (Date.now() - item.at > TTL_MS) {
    draftStore.delete(userId);
    return null;
  }
  return item;
}

export function rememberOperationDraft(
  userId: string,
  tool: string,
  args: Record<string, unknown>,
): void {
  draftStore.set(userId, { tool, args, at: Date.now() });
}

export function clearOperationDraft(userId: string): void {
  draftStore.delete(userId);
}

export function getPendingChoice(userId: string): PendingChoice | null {
  const item = choiceStore.get(userId);
  if (!item) return null;
  if (Date.now() - item.at > TTL_MS) {
    choiceStore.delete(userId);
    return null;
  }
  return item;
}

export function rememberPendingChoice(userId: string, choice: Omit<PendingChoice, "at">): void {
  choiceStore.set(userId, { ...choice, at: Date.now() });
}

export function clearPendingChoice(userId: string): void {
  choiceStore.delete(userId);
}

export function clearMockContext(userId?: string): void {
  if (userId) {
    intentStore.delete(userId);
    draftStore.delete(userId);
    choiceStore.delete(userId);
  } else {
    intentStore.clear();
    draftStore.clear();
    choiceStore.clear();
  }
}

/** Mapeia follow-up curto para tool quando só muda data ou confirma assunto. */
export function resolveFollowUpTool(text: string, lastTool: string | null): string | null {
  if (!lastTool) return null;
  const dateOnly =
    /^(e\s+)?(ontem|hoje|amanha|amanhã)$/.test(text.trim()) ||
    /^(e\s+)?(ontem|hoje|amanha)/.test(text);
  if (dateOnly) return lastTool;

  const topicMap: [RegExp, string][] = [
    [/\b(receita|faturamento|financeiro)\b/, "get_revenue_summary"],
    [/\b(devedor|devendo|pendencia|pendência)\b/, "list_debtors"],
    [/\b(agenda|agendamento|consulta)\b/, "count_appointments"],
    [/\b(dashboard|resumo|kpi)\b/, "get_dashboard_kpis"],
    [/\b(extrato|ganho|recebi)\b/, "get_extrato_summary"],
    [/\b(fatura|boleto)\b/, "list_my_invoices"],
  ];

  for (const [re, tool] of topicMap) {
    if (re.test(text)) return tool;
  }

  return null;
}
