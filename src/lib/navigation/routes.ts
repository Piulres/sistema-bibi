import type { InternoModule } from "@/lib/interno-permissions";
import type { NavTab } from "@/components/ui/NavTabs";

/** Abas do portal interno — fonte única para nav desktop e mobile. */
export const INTERNO_NAV_TABS: NavTab[] = [
  { href: "/interno/dashboard", label: "Dashboard", key: "dashboard" },
  { href: "/interno", label: "Faturamento", key: "billing" },
  { href: "/interno/agenda", label: "Agenda", key: "agenda" },
  { href: "/interno/cadastros", label: "Cadastros", key: "cadastros" },
  { href: "/interno/crm", label: "CRM Corporativo", key: "crm" },
  { href: "/interno/assinaturas", label: "Recorrência", key: "subscriptions" },
  { href: "/interno/comunicacao", label: "Comunicação", key: "comunicacao" },
  { href: "/interno/relatorios", label: "Relatórios", key: "relatorios" },
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
  "/interno/crm": "CRM Corporativo",
  "/interno/assinaturas": "Recorrência",
  "/interno/comunicacao": "Comunicação",
  "/interno/relatorios": "Relatórios",
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
  if (pathname.startsWith("/interno/crm")) return "crm";
  if (pathname.startsWith("/interno/assinaturas")) return "subscriptions";
  if (pathname.startsWith("/interno/comunicacao")) return "comunicacao";
  if (pathname.startsWith("/interno/relatorios")) return "relatorios";
  if (pathname.startsWith("/interno/branding")) return "branding";
  if (pathname.startsWith("/interno/integracoes")) return "integracoes";
  if (pathname.startsWith("/interno/seguranca")) return "seguranca";
  return undefined;
}

/** Abas do portal prestador. */
export const PRESTADOR_NAV_TABS: NavTab[] = [
  { href: "/prestador", label: "Agenda", key: "agenda" },
  { href: "/prestador/pacientes", label: "Pacientes", key: "pacientes" },
];

export function resolvePrestadorActive(pathname: string): string | undefined {
  if (pathname === "/prestador") return "agenda";
  if (pathname.startsWith("/prestador/pacientes")) return "pacientes";
  if (pathname.startsWith("/prestador/atendimento/")) return "atendimento";
  if (pathname.startsWith("/prestador/paciente/")) return "paciente";
  return undefined;
}

/** Seções de página única — portal PJ. */
export const PJ_SECTION_NAV = [
  { id: "resumo", label: "Resumo" },
  { id: "beneficiarios", label: "Beneficiários" },
  { id: "assinaturas", label: "Assinaturas" },
  { id: "faturas", label: "Faturas" },
] as const;

/** Seções de página única — portal beneficiário. */
export const BENEFICIARIO_SECTION_NAV = [
  { id: "agendar", label: "Agendar" },
  { id: "resumo", label: "Resumo" },
  { id: "agenda", label: "Agenda" },
  { id: "consumo", label: "Consumo" },
  { id: "faturas", label: "Faturas" },
  { id: "medicacoes", label: "Medicações" },
  { id: "exames", label: "Exames" },
  { id: "plano", label: "Plano de cuidado" },
  { id: "assinatura", label: "Assinatura" },
  { id: "prontuario", label: "Prontuário" },
  { id: "historico", label: "Histórico" },
] as const;

/** Rotas públicas do interno (sem shell autenticado). */
export const INTERNO_PUBLIC_PATHS = ["/interno/login", "/interno/faturamento"] as const;
