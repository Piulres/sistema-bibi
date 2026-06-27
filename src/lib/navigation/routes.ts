import type { InternoModule } from "@/lib/interno-permissions";
import type { NavTab } from "@/components/ui/NavTabs";

/** Abas do portal interno — fonte única para nav desktop e mobile. */
export const INTERNO_NAV_TABS: NavTab[] = [
  { href: "/interno/dashboard", label: "Dashboard", key: "dashboard" },
  { href: "/interno", label: "Faturamento", key: "billing" },
  { href: "/interno/agenda", label: "Agenda", key: "agenda" },
  { href: "/interno/cadastros", label: "Cadastros", key: "cadastros" },
  { href: "/interno/estoque", label: "Estoque", key: "estoque" },
  { href: "/interno/crm", label: "CRM Corporativo", key: "crm" },
  { href: "/interno/assinaturas", label: "Recorrência", key: "subscriptions" },
  { href: "/interno/comunicacao", label: "Comunicação", key: "comunicacao" },
  { href: "/interno/relatorios", label: "Relatórios", key: "relatorios" },
  { href: "/interno/auditoria", label: "Auditoria", key: "auditoria" },
  { href: "/interno/branding", label: "White Label", key: "branding" },
  { href: "/interno/integracoes", label: "Integrações", key: "integracoes" },
  { href: "/interno/seguranca", label: "Segurança", key: "seguranca" },
];

/** Rótulos curtos para breadcrumbs e links de retorno. */
export const INTERNO_ROUTE_LABELS: Record<string, string> = {
  "/interno/dashboard": "Dashboard",
  "/interno": "Faturamento",
  "/interno/faturamento": "Faturamento",
  "/interno/agenda": "Agenda",
  "/interno/cadastros": "Cadastros",
  "/interno/estoque": "Estoque Médico",
  "/interno/crm": "CRM Corporativo",
  "/interno/projetos": "Obras",
  "/interno/assinaturas": "Recorrência",
  "/interno/comunicacao": "Comunicação",
  "/interno/relatorios": "Relatórios",
  "/interno/auditoria": "Auditoria",
  "/interno/branding": "White Label",
  "/interno/integracoes": "Integrações",
  "/interno/seguranca": "Segurança",
};

/** Resolve módulo ativo do interno a partir do pathname. */
export function resolveInternoActive(pathname: string): InternoModule | undefined {
  if (pathname === "/interno/dashboard") return "dashboard";
  if (pathname === "/interno" || pathname === "/interno/faturamento") return "billing";
  if (pathname.startsWith("/interno/agenda")) return "agenda";
  if (pathname.startsWith("/interno/cadastros")) return "cadastros";
  if (pathname.startsWith("/interno/estoque")) return "estoque";
  if (pathname.startsWith("/interno/crm")) return "crm";
  if (pathname.startsWith("/interno/projetos")) return "projetos";
  if (pathname.startsWith("/interno/assinaturas")) return "subscriptions";
  if (pathname.startsWith("/interno/comunicacao")) return "comunicacao";
  if (pathname.startsWith("/interno/relatorios")) return "relatorios";
  if (pathname.startsWith("/interno/auditoria")) return "auditoria";
  if (pathname.startsWith("/interno/branding")) return "branding";
  if (pathname.startsWith("/interno/integracoes")) return "integracoes";
  if (pathname.startsWith("/interno/seguranca")) return "seguranca";
  return undefined;
}

/** Abas do portal prestador. */
export const PRESTADOR_NAV_TABS: NavTab[] = [
  { href: "/prestador/dashboard", label: "Início", key: "dashboard" },
  { href: "/prestador", label: "Agenda", key: "agenda" },
  { href: "/prestador/pacientes", label: "Pacientes", key: "pacientes" },
  { href: "/prestador/extrato", label: "Extrato", key: "extrato" },
  { href: "/prestador/relatorios", label: "Relatórios", key: "relatorios" },
];

export function resolvePrestadorActive(pathname: string): string | undefined {
  if (pathname === "/prestador/dashboard") return "dashboard";
  if (pathname.startsWith("/prestador/campo")) return "campo";
  if (pathname === "/prestador") return "agenda";
  if (pathname.startsWith("/prestador/pacientes")) return "pacientes";
  if (pathname.startsWith("/prestador/extrato")) return "extrato";
  if (pathname.startsWith("/prestador/relatorios")) return "relatorios";
  if (pathname.startsWith("/prestador/atendimento/")) return "agenda";
  if (pathname.startsWith("/prestador/paciente/")) return "pacientes";
  return undefined;
}

/** Seções de página única — portal PJ. */
export const PJ_SECTION_NAV = [
  { id: "resumo", label: "Resumo" },
  { id: "beneficiarios", label: "Beneficiários" },
  { id: "assinaturas", label: "Assinaturas" },
  { id: "faturas", label: "Faturas" },
] as const;

/** Abas do portal beneficiário — rotas dedicadas. */
export const BENEFICIARIO_NAV_TABS: NavTab[] = [
  { href: "/beneficiario/agendar", label: "Agendar", key: "agendar" },
  { href: "/beneficiario/resumo", label: "Resumo", key: "resumo" },
  { href: "/beneficiario/agenda", label: "Agenda", key: "agenda" },
  { href: "/beneficiario/consumo", label: "Consumo", key: "consumo" },
  { href: "/beneficiario/faturas", label: "Faturas", key: "faturas" },
  { href: "/beneficiario/medicacoes", label: "Medicações", key: "medicacoes" },
  { href: "/beneficiario/exames", label: "Exames", key: "exames" },
  { href: "/beneficiario/plano", label: "Plano", key: "plano" },
  { href: "/beneficiario/assinatura", label: "Assinatura", key: "assinatura" },
  { href: "/beneficiario/prontuario", label: "Prontuário", key: "prontuario" },
  { href: "/beneficiario/historico", label: "Histórico", key: "historico" },
];

export function resolveBeneficiarioActive(pathname: string): string | undefined {
  if (pathname === "/beneficiario" || pathname.startsWith("/beneficiario/resumo")) return "resumo";
  if (pathname.startsWith("/beneficiario/agendar")) return "agendar";
  if (pathname.startsWith("/beneficiario/agenda")) return "agenda";
  if (pathname.startsWith("/beneficiario/obras")) return "obras";
  if (pathname.startsWith("/beneficiario/consumo")) return "consumo";
  if (pathname.startsWith("/beneficiario/faturas")) return "faturas";
  if (pathname.startsWith("/beneficiario/medicacoes")) return "medicacoes";
  if (pathname.startsWith("/beneficiario/exames")) return "exames";
  if (pathname.startsWith("/beneficiario/plano")) return "plano";
  if (pathname.startsWith("/beneficiario/assinatura")) return "assinatura";
  if (pathname.startsWith("/beneficiario/prontuario")) return "prontuario";
  if (pathname.startsWith("/beneficiario/historico")) return "historico";
  return undefined;
}

/** Rotas públicas do interno (sem shell autenticado). */
export const INTERNO_PUBLIC_PATHS = ["/interno/login", "/interno/faturamento"] as const;
