/** Status de obra/projeto (nicho CONSTRUCTION). */
export const PROJECT_STATUSES = [
  { value: "ORCAMENTO", label: "Orçamento" },
  { value: "PROPOSTA", label: "Proposta" },
  { value: "APROVADO", label: "Aprovado" },
  { value: "EM_OBRA", label: "Em obra" },
  { value: "PARALISADO", label: "Paralisado" },
  { value: "CONCLUIDO", label: "Concluído" },
  { value: "CANCELADO", label: "Cancelado" },
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number]["value"];

const PROJECT_STATUS_SET = new Set<string>(PROJECT_STATUSES.map((s) => s.value));

export function isProjectStatus(value: string): value is ProjectStatus {
  return PROJECT_STATUS_SET.has(value);
}

export function projectStatusLabel(status: string): string {
  return PROJECT_STATUSES.find((s) => s.value === status)?.label ?? status;
}

/** Status de orçamento. */
export const BUDGET_STATUSES = [
  { value: "RASCUNHO", label: "Rascunho" },
  { value: "ENVIADO", label: "Enviado" },
  { value: "APROVADO_PJ", label: "Aprovado pelo cliente" },
  { value: "APROVADO", label: "Aprovado" },
  { value: "REJEITADO", label: "Rejeitado" },
  { value: "SUBSTITUIDO", label: "Substituído" },
] as const;

export type BudgetStatus = (typeof BUDGET_STATUSES)[number]["value"];

const BUDGET_STATUS_SET = new Set<string>(BUDGET_STATUSES.map((s) => s.value));

export function isBudgetStatus(value: string): value is BudgetStatus {
  return BUDGET_STATUS_SET.has(value);
}

export function budgetStatusLabel(status: string): string {
  return BUDGET_STATUSES.find((s) => s.value === status)?.label ?? status;
}

/** Fases do cronograma. */
export const TASK_PHASES = [
  { value: "FUNDACAO", label: "Fundação" },
  { value: "ESTRUTURA", label: "Estrutura" },
  { value: "ACABAMENTO", label: "Acabamento" },
  { value: "GERAL", label: "Geral" },
] as const;

export type TaskPhase = (typeof TASK_PHASES)[number]["value"];

export function taskPhaseLabel(phase: string): string {
  return TASK_PHASES.find((p) => p.value === phase)?.label ?? phase;
}

/** Status de tarefa do cronograma. */
export const TASK_STATUSES = [
  { value: "PENDENTE", label: "Pendente" },
  { value: "EM_ANDAMENTO", label: "Em andamento" },
  { value: "CONCLUIDO", label: "Concluído" },
  { value: "ATRASADO", label: "Atrasado" },
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number]["value"];

const TASK_STATUS_SET = new Set<string>(TASK_STATUSES.map((s) => s.value));

export function isTaskStatus(value: string): value is TaskStatus {
  return TASK_STATUS_SET.has(value);
}

export function taskStatusLabel(status: string): string {
  return TASK_STATUSES.find((s) => s.value === status)?.label ?? status;
}

/** Categorias de anexo técnico. */
export const ATTACHMENT_CATEGORIES = [
  { value: "PLANTA", label: "Planta" },
  { value: "LAUDO", label: "Laudo" },
  { value: "ART", label: "ART" },
  { value: "CONTRATO", label: "Contrato" },
  { value: "MEMORIAL", label: "Memorial descritivo" },
  { value: "FOTO_CAMPO", label: "Foto de campo" },
  { value: "OUTRO", label: "Outro" },
] as const;

export type AttachmentCategory = (typeof ATTACHMENT_CATEGORIES)[number]["value"];

const ATTACHMENT_CATEGORY_SET = new Set<string>(ATTACHMENT_CATEGORIES.map((c) => c.value));

export function isAttachmentCategory(value: string): value is AttachmentCategory {
  return ATTACHMENT_CATEGORY_SET.has(value);
}

export function attachmentCategoryLabel(category: string): string {
  return ATTACHMENT_CATEGORIES.find((c) => c.value === category)?.label ?? category;
}

export const ATTACHMENT_ENTITY_TYPES = ["Project", "Budget", "DailyFieldReport"] as const;
export type AttachmentEntityType = (typeof ATTACHMENT_ENTITY_TYPES)[number];

export function isAttachmentEntityType(value: string): value is AttachmentEntityType {
  return (ATTACHMENT_ENTITY_TYPES as readonly string[]).includes(value);
}

/** Ofícios de mão de obra em obra (Engenharia Civil). */
export const FIELD_TRADES = [
  { value: "PEDREIRO", label: "Pedreiro" },
  { value: "PINTOR", label: "Pintor" },
  { value: "ELETRICISTA", label: "Eletricista" },
  { value: "ENCANADOR", label: "Encanador" },
  { value: "GESSEIRO", label: "Gesseiro" },
  { value: "CARPINTEIRO", label: "Carpinteiro" },
  { value: "SERVENTE", label: "Servente" },
  { value: "MESTRE_OBRAS", label: "Mestre de obras" },
  { value: "ENGENHEIRO", label: "Engenheiro civil" },
  { value: "ARQUITETO", label: "Arquiteto" },
  { value: "OUTRO", label: "Outro" },
] as const;

export type FieldTrade = (typeof FIELD_TRADES)[number]["value"];

const FIELD_TRADE_SET = new Set<string>(FIELD_TRADES.map((t) => t.value));

export function isFieldTrade(value: string): value is FieldTrade {
  return FIELD_TRADE_SET.has(value);
}

export function fieldTradeLabel(trade: string): string {
  return FIELD_TRADES.find((t) => t.value === trade)?.label ?? trade;
}

/** Status do registro diário de campo (RDO). */
export const FIELD_REPORT_STATUSES = [
  { value: "RASCUNHO", label: "Rascunho" },
  { value: "ENVIADO", label: "Enviado" },
  { value: "APROVADO", label: "Aprovado" },
  { value: "FATURADO", label: "Faturado" },
] as const;

export type FieldReportStatus = (typeof FIELD_REPORT_STATUSES)[number]["value"];

const FIELD_REPORT_STATUS_SET = new Set<string>(FIELD_REPORT_STATUSES.map((s) => s.value));

export function isFieldReportStatus(value: string): value is FieldReportStatus {
  return FIELD_REPORT_STATUS_SET.has(value);
}

export function fieldReportStatusLabel(status: string): string {
  return FIELD_REPORT_STATUSES.find((s) => s.value === status)?.label ?? status;
}

/** Modo de cobrança da obra. */
export const PROJECT_BILLING_MODES = [
  { value: "FECHADO", label: "Obra fechada" },
  { value: "DIARIA", label: "Por diária" },
  { value: "MISTO", label: "Fechado + diárias" },
] as const;

export function projectBillingModeLabel(mode: string): string {
  return PROJECT_BILLING_MODES.find((m) => m.value === mode)?.label ?? mode;
}
