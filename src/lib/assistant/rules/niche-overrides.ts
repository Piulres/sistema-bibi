import "server-only";
import type { NicheId } from "@/lib/niche/types";
import type { AssistantRuleDef } from "@/lib/assistant/rules/types";

type NicheRulePatch = {
  tool: string;
  triggers: readonly string[];
  priority?: number;
};

/**
 * Vocabulário adicional por nicho — complementa templates globais.
 * Estrutura: mesma tool, gatilhos extras com termos do segmento.
 */
const NICHE_RULE_PATCHES: Partial<Record<NicheId, readonly NicheRulePatch[]>> = {
  VET: [
    {
      tool: "count_appointments",
      priority: 12,
      triggers: ["pet", "pets", "tutor", "banho", "tosa", "vacina", "atendimento pet"],
    },
    {
      tool: "search_patients",
      triggers: ["buscar pet", "buscar tutor", "achar pet", "localizar pet"],
    },
    {
      tool: "draft_create_appointment",
      triggers: ["marcar banho", "agendar tosa", "vacinar pet", "consulta veterinaria"],
    },
  ],
  LEGAL: [
    {
      tool: "count_appointments",
      triggers: ["cliente", "clientes", "advogado", "audiencia", "audiência", "processo"],
    },
    {
      tool: "search_patients",
      triggers: ["buscar cliente", "achar cliente", "localizar cliente"],
    },
    {
      tool: "list_my_patients",
      triggers: ["meus clientes", "lista de clientes"],
    },
  ],
  DENTAL: [
    {
      tool: "count_appointments",
      triggers: ["odontologica", "odontológica", "dente", "dentista", "limpeza dental"],
    },
    {
      tool: "draft_create_appointment",
      triggers: ["marcar limpeza", "agendar avaliacao odontologica"],
    },
  ],
  SPA: [
    {
      tool: "count_appointments",
      triggers: ["sessao", "sessão", "massagem", "tratamento estetico", "cliente spa"],
    },
    {
      tool: "draft_create_appointment",
      triggers: ["agendar sessao", "marcar massagem", "reservar tratamento"],
    },
  ],
  EDUCATION: [
    {
      tool: "count_appointments",
      triggers: ["aula", "aulas", "aluno", "alunos", "instrutor", "matricula", "matrícula"],
    },
    {
      tool: "list_my_patients",
      triggers: ["meus alunos", "lista de alunos"],
    },
  ],
  CONSTRUCTION: [
    {
      tool: "get_dashboard_kpis",
      triggers: ["obra", "obras", "projeto", "rdo", "cronograma", "empreiteira"],
    },
    {
      tool: "count_appointments",
      triggers: ["visita tecnica", "visita técnica", "vistoria", "campo"],
    },
  ],
};

/** Regras de nicho como entradas separadas (merge por tool na resolução). */
export function nicheRuleOverrides(niche: NicheId): readonly AssistantRuleDef[] {
  const patches = NICHE_RULE_PATCHES[niche];
  if (!patches?.length) return [];

  return patches.map((patch, index) => ({
    id: `niche:${niche}:${patch.tool}:${index}`,
    tool: patch.tool,
    triggers: patch.triggers,
    priority: patch.priority,
    source: "niche" as const,
    niche,
  }));
}
