import type { NicheId } from "@/lib/niche/types";

/** Gatilho especial com extração de argumentos dedicada. */
export type AssistantRuleSpecial =
  | "create_user"
  | "create_patient"
  | "create_appointment"
  | "book_appointment";

/** Definição de regra resolvida (global + nicho + tenant). */
export type AssistantRuleDef = {
  id: string;
  tool: string;
  roles?: readonly string[];
  triggers: readonly string[];
  priority?: number;
  special?: AssistantRuleSpecial;
  /** Camada de origem após merge. */
  source: "global" | "niche" | "tenant";
  niche?: NicheId;
};

/** Override parcial por tenant (Fase 3 — persistido em Tenant.settings). */
export type TenantRuleOverride = {
  tool: string;
  addTriggers?: string[];
  removeTriggers?: string[];
  disabled?: boolean;
};

/** Contexto para resolução de regras efetivas. */
export type RuleResolutionContext = {
  niche: NicheId;
  tenantOverrides?: readonly TenantRuleOverride[];
};

/** Estatísticas do motor para painel interno. */
export type RuleEngineStats = {
  globalRules: number;
  nicheRules: number;
  tenantOverrides: number;
  totalTriggers: number;
  niche: NicheId;
};
