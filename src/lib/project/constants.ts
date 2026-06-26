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

export const ATTACHMENT_ENTITY_TYPES = ["Project", "Budget"] as const;
export type AttachmentEntityType = (typeof ATTACHMENT_ENTITY_TYPES)[number];

export function isAttachmentEntityType(value: string): value is AttachmentEntityType {
  return (ATTACHMENT_ENTITY_TYPES as readonly string[]).includes(value);
}
