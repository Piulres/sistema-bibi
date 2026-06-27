import type { Role } from "@/lib/roles";
import type { NicheId } from "@/lib/niche/types";

export type ScenarioCategory =
  | "read"
  | "help"
  | "draft"
  | "multi_turn"
  | "disambiguation"
  | "error"
  | "empty"
  | "rbac"
  | "niche";

export type AssistantScenario = {
  id: string;
  role: Role;
  category: ScenarioCategory;
  phrase: string;
  expectedTool?: string;
  /** Regex ou substring esperada na resposta (quando aplicável) */
  responsePatterns?: (string | RegExp)[];
  /** Nicho opcional — padrão MEDICAL */
  niche?: NicheId;
  /** Perfil interno quando role=INTERNO */
  internoProfile?: "ADMIN" | "FATURAMENTO" | "RECEPCAO" | "READONLY";
  notes?: string;
};

/** Catálogo de cenários mapeados — usado em testes de roteamento e tom humanizado. */
export const ASSISTANT_SCENARIOS: AssistantScenario[] = [
  // ── INTERNO · leitura ──────────────────────────────────────────────
  { id: "int-read-appointments-today", role: "INTERNO", category: "read", phrase: "Quantos agendamentos temos hoje?", expectedTool: "count_appointments" },
  { id: "int-read-appointments-synonym", role: "INTERNO", category: "read", phrase: "Qual a lotação do dia?", expectedTool: "count_appointments" },
  { id: "int-read-revenue-yesterday", role: "INTERNO", category: "read", phrase: "Quanto faturamos ontem?", expectedTool: "get_revenue_summary" },
  { id: "int-read-revenue-panorama", role: "INTERNO", category: "read", phrase: "Panorama financeiro de hoje", expectedTool: "get_revenue_summary" },
  { id: "int-read-debtors", role: "INTERNO", category: "read", phrase: "Quem está devendo?", expectedTool: "list_debtors", internoProfile: "ADMIN" },
  { id: "int-read-debtors-synonym", role: "INTERNO", category: "read", phrase: "Lista de inadimplentes", expectedTool: "list_debtors", internoProfile: "ADMIN" },
  { id: "int-read-dashboard", role: "INTERNO", category: "read", phrase: "Resumo executivo", expectedTool: "get_dashboard_kpis" },
  { id: "int-read-dashboard-ops", role: "INTERNO", category: "read", phrase: "Como está a operação?", expectedTool: "get_dashboard_kpis" },
  { id: "int-read-users", role: "INTERNO", category: "read", phrase: "Listar usuários do sistema", expectedTool: "list_users", internoProfile: "ADMIN" },
  { id: "int-read-providers", role: "INTERNO", category: "read", phrase: "Listar prestadores", expectedTool: "list_providers", internoProfile: "RECEPCAO" },
  { id: "int-read-procedures", role: "INTERNO", category: "read", phrase: "Quais procedimentos temos?", expectedTool: "list_procedures", internoProfile: "RECEPCAO" },
  { id: "int-read-search-patient", role: "INTERNO", category: "read", phrase: "Buscar paciente João", expectedTool: "search_patients", internoProfile: "RECEPCAO" },

  // ── INTERNO · ajuda ──────────────────────────────────────────────────
  { id: "int-help-billing", role: "INTERNO", category: "help", phrase: "Como faturar um paciente?", expectedTool: "explain_capability" },
  { id: "int-help-cadastro", role: "INTERNO", category: "help", phrase: "Como cadastrar paciente?", expectedTool: "explain_capability" },
  { id: "int-help-agenda", role: "INTERNO", category: "help", phrase: "Como funciona o agendamento na plataforma?", expectedTool: "explain_capability" },

  // ── INTERNO · drafts ─────────────────────────────────────────────────
  { id: "int-draft-user", role: "INTERNO", category: "draft", phrase: "Criar usuário João joao@x.com senha bibi123 prestador", expectedTool: "draft_create_user", internoProfile: "ADMIN" },
  { id: "int-draft-appointment-start", role: "INTERNO", category: "draft", phrase: "preciso marcar uma consulta", expectedTool: "draft_create_appointment", internoProfile: "RECEPCAO", responsePatterns: [/para quem|paciente/i] },
  { id: "int-draft-appointment-full", role: "INTERNO", category: "draft", phrase: "Agendar consulta para João Pereira amanhã às 15h com Dra Helena", expectedTool: "draft_create_appointment", internoProfile: "RECEPCAO" },
  { id: "int-draft-appointment-unknown-provider", role: "INTERNO", category: "draft", phrase: "marcar consulta para João Pereira amanhã às 11h, não sei o médico", expectedTool: "draft_create_appointment", internoProfile: "RECEPCAO", responsePatterns: [/opções|prestador/i] },
  { id: "int-draft-appointment-by-procedure", role: "INTERNO", category: "draft", phrase: "marcar eletrocardiograma para João Pereira amanhã às 11h", expectedTool: "draft_create_appointment", internoProfile: "RECEPCAO", responsePatterns: [/eletrocardiograma|opções|prestador/i] },
  { id: "int-draft-patient", role: "INTERNO", category: "draft", phrase: "Cadastrar paciente Maria 52998224725 nascimento 15/03/1990", expectedTool: "draft_create_patient", internoProfile: "ADMIN" },

  // ── INTERNO · multi-turn ─────────────────────────────────────────────
  { id: "int-multi-appointment", role: "INTERNO", category: "multi_turn", phrase: "preciso marcar uma consulta → é pro João Pereira → amanhã às 15h com a Dra Helena", internoProfile: "RECEPCAO", notes: "Fluxo em 3 turnos até confirmação" },
  { id: "int-multi-disambig-ana", role: "INTERNO", category: "disambiguation", phrase: "Agendar consulta para Ana amanhã às 10:00 com Dra Helena", internoProfile: "RECEPCAO", responsePatterns: [/opções|correta/i] },

  // ── INTERNO · RBAC ───────────────────────────────────────────────────
  { id: "int-rbac-readonly-no-debtors", role: "INTERNO", category: "rbac", phrase: "Quem está devendo?", internoProfile: "READONLY", notes: "READONLY não tem list_debtors" },
  { id: "int-rbac-readonly-no-draft", role: "INTERNO", category: "rbac", phrase: "Criar usuário teste", internoProfile: "READONLY", notes: "READONLY não executa draft_create_user" },

  // ── PRESTADOR ────────────────────────────────────────────────────────
  { id: "prest-read-agenda", role: "PRESTADOR", category: "read", phrase: "Minha agenda de hoje", expectedTool: "list_my_appointments" },
  { id: "prest-read-agenda-synonym", role: "PRESTADOR", category: "read", phrase: "O que tenho hoje?", expectedTool: "list_my_appointments" },
  { id: "prest-read-patients", role: "PRESTADOR", category: "read", phrase: "Meus pacientes", expectedTool: "list_my_patients" },
  { id: "prest-read-extrato", role: "PRESTADOR", category: "read", phrase: "Extrato do mês", expectedTool: "get_extrato_summary" },
  { id: "prest-read-dashboard", role: "PRESTADOR", category: "read", phrase: "Resumo do dashboard", expectedTool: "get_prestador_dashboard" },
  { id: "prest-help-agenda", role: "PRESTADOR", category: "help", phrase: "como funciona minha agenda?", expectedTool: "explain_capability" },
  { id: "prest-help-procedure", role: "PRESTADOR", category: "help", phrase: "Como registrar procedimento?", expectedTool: "explain_capability" },

  // ── PJ ───────────────────────────────────────────────────────────────
  { id: "pj-read-overview", role: "PJ", category: "read", phrase: "Resumo da empresa", expectedTool: "get_pj_overview" },
  { id: "pj-read-beneficiaries", role: "PJ", category: "read", phrase: "Beneficiários ativos", expectedTool: "list_company_beneficiaries" },
  { id: "pj-read-invoices", role: "PJ", category: "read", phrase: "Faturas em aberto", expectedTool: "get_open_invoices" },
  { id: "pj-help-plan", role: "PJ", category: "help", phrase: "Como funciona o plano?", expectedTool: "explain_capability" },

  // ── BENEFICIÁRIO ─────────────────────────────────────────────────────
  { id: "ben-read-overview", role: "BENEFICIARIO", category: "read", phrase: "Meu resumo", expectedTool: "get_my_overview" },
  { id: "ben-read-appointments", role: "BENEFICIARIO", category: "read", phrase: "Próximos agendamentos", expectedTool: "list_my_appointments" },
  { id: "ben-read-invoices", role: "BENEFICIARIO", category: "read", phrase: "Minhas faturas", expectedTool: "list_my_invoices" },
  { id: "ben-read-slots", role: "BENEFICIARIO", category: "read", phrase: "Horários disponíveis hoje", expectedTool: "list_available_slots" },
  { id: "ben-help-schedule", role: "BENEFICIARIO", category: "help", phrase: "como agendar consulta?", expectedTool: "explain_capability" },
  { id: "ben-draft-book", role: "BENEFICIARIO", category: "draft", phrase: "Quero marcar consulta amanhã às 10h", expectedTool: "draft_book_appointment", responsePatterns: [/horário|prestador|confirme|opções/i] },
  { id: "ben-draft-book-no-pref", role: "BENEFICIARIO", category: "draft", phrase: "Marcar para amanhã às 14h sem preferência de prestador", expectedTool: "draft_book_appointment" },

  // ── Sinônimos receita ────────────────────────────────────────────────
  { id: "int-revenue-syn-1", role: "INTERNO", category: "read", phrase: "Quanto entrou hoje?", expectedTool: "get_revenue_summary" },
  { id: "int-revenue-syn-2", role: "INTERNO", category: "read", phrase: "Fechamento financeiro de ontem", expectedTool: "get_revenue_summary" },
  { id: "int-revenue-syn-3", role: "INTERNO", category: "read", phrase: "Volume faturado", expectedTool: "get_revenue_summary" },

  // ── Composto ─────────────────────────────────────────────────────────
  { id: "int-composite", role: "INTERNO", category: "read", phrase: "Agendamentos de hoje e quem está devendo", internoProfile: "ADMIN", notes: "Múltiplas tools" },

  // ── Nichos ───────────────────────────────────────────────────────────
  { id: "vet-ben-help", role: "BENEFICIARIO", category: "niche", niche: "VET", phrase: "como agendar atendimento?", expectedTool: "explain_capability" },
  { id: "legal-int-help", role: "INTERNO", category: "niche", niche: "LEGAL", phrase: "Como cadastrar cliente?", expectedTool: "explain_capability" },
  { id: "edu-prest-agenda", role: "PRESTADOR", category: "niche", niche: "EDUCATION", phrase: "Minha agenda de hoje", expectedTool: "list_my_appointments" },
  { id: "vet-int-search-pets", role: "INTERNO", category: "niche", niche: "VET", phrase: "buscar pet Thor", expectedTool: "search_pets", internoProfile: "RECEPCAO" },
  { id: "vet-int-draft-appt", role: "INTERNO", category: "draft", niche: "VET", phrase: "agendar atendimento para o pet Thor do tutor João amanhã às 10h", expectedTool: "draft_create_appointment", internoProfile: "RECEPCAO" },
  { id: "spa-int-agenda", role: "INTERNO", category: "niche", niche: "SPA", phrase: "Quantos agendamentos temos hoje?", expectedTool: "count_appointments" },
  { id: "dental-int-help", role: "INTERNO", category: "niche", niche: "DENTAL", phrase: "Como funciona o agendamento na plataforma?", expectedTool: "explain_capability" },

  // ── Fallback / erro ──────────────────────────────────────────────────
  { id: "int-fallback-gibberish", role: "INTERNO", category: "error", phrase: "xyzqwerty blabla", notes: "Deve cair em fallback humanizado" },
  { id: "prest-fallback-gibberish", role: "PRESTADOR", category: "error", phrase: "asdfghjkl", notes: "Fallback portal prestador" },
  { id: "pj-fallback-gibberish", role: "PJ", category: "error", phrase: "???", notes: "Fallback portal PJ" },
  { id: "ben-fallback-gibberish", role: "BENEFICIARIO", category: "error", phrase: "hm", notes: "Fallback portal beneficiário" },

  // ── Follow-up ──────────────────────────────────────────────────────────
  { id: "int-followup-yesterday", role: "INTERNO", category: "read", phrase: "e ontem?", notes: "Follow-up após receita", expectedTool: "get_revenue_summary" },

  // ── Extra cobertura ────────────────────────────────────────────────────
  { id: "int-recep-marcar", role: "INTERNO", category: "draft", phrase: "Marcar consulta", expectedTool: "draft_create_appointment", internoProfile: "RECEPCAO" },
  { id: "int-recep-walkin", role: "INTERNO", category: "help", phrase: "Como fazer walk-in particular?", expectedTool: "explain_capability", internoProfile: "RECEPCAO" },
  { id: "int-fat-revenue", role: "INTERNO", category: "read", phrase: "Receita do mês", expectedTool: "get_revenue_summary", internoProfile: "FATURAMENTO" },
  { id: "prest-next", role: "PRESTADOR", category: "read", phrase: "Como está meu dia?", expectedTool: "get_prestador_dashboard" },
  { id: "prest-revenue", role: "PRESTADOR", category: "read", phrase: "Quanto recebi?", expectedTool: "get_extrato_summary" },
  { id: "pj-colaboradores", role: "PJ", category: "read", phrase: "Colaboradores ativos", expectedTool: "list_company_beneficiaries" },
  { id: "pj-pendencias", role: "PJ", category: "read", phrase: "O que devemos?", expectedTool: "get_open_invoices" },
  { id: "ben-pix", role: "BENEFICIARIO", category: "help", phrase: "Como pagar PIX?", expectedTool: "explain_capability" },
  { id: "ben-debt", role: "BENEFICIARIO", category: "read", phrase: "O que devo?", expectedTool: "list_my_invoices" },
  { id: "ben-procedure", role: "BENEFICIARIO", category: "draft", phrase: "Quero marcar eletrocardiograma amanhã às 9h", expectedTool: "draft_book_appointment" },
];

export function scenariosByCategory(category: ScenarioCategory): AssistantScenario[] {
  return ASSISTANT_SCENARIOS.filter((s) => s.category === category);
}

export function scenariosByRole(role: Role): AssistantScenario[] {
  return ASSISTANT_SCENARIOS.filter((s) => s.role === role);
}

export function scenariosWithExpectedTool(): AssistantScenario[] {
  return ASSISTANT_SCENARIOS.filter((s) => s.expectedTool);
}

export function scenarioCount(): number {
  return ASSISTANT_SCENARIOS.length;
}
