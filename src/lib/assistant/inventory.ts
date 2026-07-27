import type { Role } from "@/lib/roles";
import type { NicheId } from "@/lib/niche/types";
import type { InternoProfile } from "@/lib/interno-permissions";

/** Tool do assistente no inventário de fluxos. */
export type AssistantToolInventoryEntry = {
  name: string;
  portal: Role | "SHARED";
  kind: "read" | "write" | "draft" | "help";
  requiredModule?: string;
  requiredInternoAdmin?: boolean;
  niches?: NicheId[] | "all";
  description: string;
};

/** Inventário canônico — base para regras, testes de rotina e painel (Fase 0). */
export const ASSISTANT_TOOL_INVENTORY: AssistantToolInventoryEntry[] = [
  // Interno — leitura
  { name: "get_dashboard_kpis", portal: "INTERNO", kind: "read", requiredModule: "dashboard", niches: "all", description: "KPIs do dashboard executivo" },
  { name: "count_appointments", portal: "INTERNO", kind: "read", requiredModule: "agenda", niches: "all", description: "Contagem de agendamentos por data" },
  { name: "get_revenue_summary", portal: "INTERNO", kind: "read", requiredModule: "billing", niches: "all", description: "Resumo de receita por período" },
  { name: "list_debtors", portal: "INTERNO", kind: "read", requiredModule: "billing", niches: "all", description: "Inadimplentes" },
  { name: "list_users", portal: "INTERNO", kind: "read", requiredModule: "cadastros", requiredInternoAdmin: true, niches: "all", description: "Usuários do tenant" },
  { name: "search_patients", portal: "INTERNO", kind: "read", requiredModule: "cadastros", niches: "all", description: "Busca de pacientes/clientes" },
  { name: "search_pets", portal: "INTERNO", kind: "read", requiredModule: "cadastros", niches: ["VET"], description: "Busca de pets (VET)" },
  { name: "list_providers", portal: "INTERNO", kind: "read", requiredModule: "cadastros", niches: "all", description: "Prestadores cadastrados" },
  { name: "list_procedures", portal: "INTERNO", kind: "read", requiredModule: "cadastros", niches: "all", description: "Catálogo de procedimentos" },
  // Interno — escrita (draft + confirm)
  { name: "draft_create_user", portal: "INTERNO", kind: "draft", requiredModule: "cadastros", requiredInternoAdmin: true, niches: "all", description: "Rascunho de novo usuário" },
  { name: "draft_create_patient", portal: "INTERNO", kind: "draft", requiredModule: "cadastros", requiredInternoAdmin: true, niches: "all", description: "Rascunho de novo paciente/cliente" },
  { name: "draft_create_appointment", portal: "INTERNO", kind: "draft", requiredModule: "agenda", niches: "all", description: "Rascunho de agendamento" },
  // Prestador
  { name: "get_prestador_dashboard", portal: "PRESTADOR", kind: "read", niches: "all", description: "Resumo do dia do prestador" },
  { name: "list_my_appointments", portal: "PRESTADOR", kind: "read", niches: "all", description: "Agenda do prestador" },
  { name: "list_my_patients", portal: "PRESTADOR", kind: "read", niches: "all", description: "Carteira de pacientes" },
  { name: "get_extrato_summary", portal: "PRESTADOR", kind: "read", niches: "all", description: "Extrato financeiro" },
  // PJ
  { name: "get_pj_overview", portal: "PJ", kind: "read", niches: "all", description: "Visão geral da empresa" },
  { name: "list_company_beneficiaries", portal: "PJ", kind: "read", niches: "all", description: "Colaboradores/beneficiários ativos" },
  { name: "get_open_invoices", portal: "PJ", kind: "read", niches: "all", description: "Faturas em aberto" },
  // Beneficiário
  { name: "get_my_overview", portal: "BENEFICIARIO", kind: "read", niches: "all", description: "Resumo pessoal" },
  { name: "list_my_invoices", portal: "BENEFICIARIO", kind: "read", niches: "all", description: "Faturas do beneficiário" },
  { name: "list_available_slots", portal: "BENEFICIARIO", kind: "read", niches: "all", description: "Horários disponíveis" },
  { name: "draft_book_appointment", portal: "BENEFICIARIO", kind: "draft", niches: "all", description: "Auto-agendamento" },
  // Compartilhado
  { name: "explain_capability", portal: "SHARED", kind: "help", niches: "all", description: "Ajuda contextual / RAG" },
];

export type RoutineMatrixCell = {
  portal: Role;
  niche: NicheId;
  profile?: InternoProfile;
  scenarioIds: string[];
};

/** Agrupa cenários do catálogo por portal × nicho para cobertura de rotina. */
export function buildRoutineMatrix(
  scenarios: { id: string; role: Role; niche?: NicheId; internoProfile?: InternoProfile }[],
): RoutineMatrixCell[] {
  const niches: NicheId[] = ["MEDICAL", "VET", "DENTAL", "LEGAL", "SPA", "EDUCATION", "CONSTRUCTION"];
  const portals: Role[] = ["INTERNO", "PRESTADOR", "PJ", "BENEFICIARIO"];
  const cells: RoutineMatrixCell[] = [];

  for (const portal of portals) {
    for (const niche of niches) {
      const matching = scenarios.filter(
        (s) => s.role === portal && (s.niche === niche || (!s.niche && niche === "MEDICAL")),
      );
      if (matching.length === 0 && portal !== "INTERNO" && niche !== "MEDICAL") continue;
      cells.push({
        portal,
        niche,
        scenarioIds: matching.map((s) => s.id),
      });
    }
  }
  return cells;
}

export function inventoryByPortal(portal: Role | "SHARED"): AssistantToolInventoryEntry[] {
  return ASSISTANT_TOOL_INVENTORY.filter((t) => t.portal === portal || t.portal === "SHARED");
}
