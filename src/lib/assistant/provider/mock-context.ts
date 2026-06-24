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

const TTL_MS = 15 * 60 * 1000;
const intentStore = new Map<string, LastIntent>();
const draftStore = new Map<string, OperationDraft>();

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

export function clearMockContext(userId?: string): void {
  if (userId) {
    intentStore.delete(userId);
    draftStore.delete(userId);
  } else {
    intentStore.clear();
    draftStore.clear();
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
