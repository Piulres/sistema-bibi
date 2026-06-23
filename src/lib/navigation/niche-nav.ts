import type { NavTab } from "@/components/ui/NavTabs";
import type { InternoModule } from "@/lib/interno-permissions";
import type { NicheId, NicheLabels } from "@/lib/niche/types";

function estoqueTabLabel(niche: NicheId): string {
  switch (niche) {
    case "MEDICAL":
    case "DENTAL":
      return "Estoque clínico";
    case "VET":
      return "Estoque pet";
    case "LEGAL":
      return "Insumos";
    case "SPA":
      return "Insumos spa";
    case "EDUCATION":
      return "Materiais";
    default:
      return "Estoque";
  }
}

/** Abas do portal interno com termos do nicho. */
export function buildInternoNavTabs(labels: NicheLabels, niche: NicheId): NavTab[] {
  return [
    { href: "/interno/dashboard", label: "Dashboard", key: "dashboard" as InternoModule },
    { href: "/interno", label: "Faturamento", key: "billing" },
    { href: "/interno/agenda", label: labels.appointments, key: "agenda" },
    { href: "/interno/cadastros", label: `Cadastros · ${labels.beneficiaries}`, key: "cadastros" },
    { href: "/interno/estoque", label: estoqueTabLabel(niche), key: "estoque" },
    { href: "/interno/crm", label: "CRM Corporativo", key: "crm" },
    { href: "/interno/assinaturas", label: "Recorrência", key: "subscriptions" },
    { href: "/interno/comunicacao", label: "Comunicação", key: "comunicacao" },
    { href: "/interno/relatorios", label: "Relatórios", key: "relatorios" },
    { href: "/interno/auditoria", label: "Auditoria", key: "auditoria" },
    { href: "/interno/branding", label: "White Label", key: "branding" },
    { href: "/interno/integracoes", label: "Integrações", key: "integracoes" },
    { href: "/interno/seguranca", label: "Segurança", key: "seguranca" },
  ];
}

/** Abas do prestador com termos do nicho. */
export function buildPrestadorNavTabs(labels: NicheLabels): NavTab[] {
  return [
    { href: "/prestador/dashboard", label: "Início", key: "dashboard" },
    { href: "/prestador", label: "Agenda", key: "agenda" },
    { href: "/prestador/pacientes", label: labels.patients, key: "pacientes" },
    { href: "/prestador/extrato", label: "Extrato", key: "extrato" },
    { href: "/prestador/relatorios", label: "Relatórios", key: "relatorios" },
  ];
}

/** Abas do beneficiário com termos do nicho. */
export function buildBeneficiarioNavTabs(labels: NicheLabels): NavTab[] {
  return [
    { href: "/beneficiario/agendar", label: "Agendar", key: "agendar" },
    { href: "/beneficiario/resumo", label: "Resumo", key: "resumo" },
    { href: "/beneficiario/agenda", label: "Agenda", key: "agenda" },
    { href: "/beneficiario/consumo", label: "Consumo", key: "consumo" },
    { href: "/beneficiario/faturas", label: "Faturas", key: "faturas" },
    { href: "/beneficiario/medicacoes", label: "Medicações", key: "medicacoes" },
    { href: "/beneficiario/exames", label: "Exames", key: "exames" },
    { href: "/beneficiario/plano", label: "Plano", key: "plano" },
    { href: "/beneficiario/assinatura", label: "Assinatura", key: "assinatura" },
    { href: "/beneficiario/prontuario", label: labels.medicalRecord, key: "prontuario" },
    { href: "/beneficiario/historico", label: "Histórico", key: "historico" },
  ];
}

/** Seções do portal PJ. */
export function buildPjSectionNav(labels: NicheLabels) {
  return [
    { id: "resumo", label: "Resumo" },
    { id: "beneficiarios", label: labels.beneficiaries },
    { id: "assinaturas", label: "Assinaturas" },
    { id: "faturas", label: "Faturas" },
  ] as const;
}

function companiesTabLabel(labels: NicheLabels): string {
  switch (labels.company) {
    case "Empresa":
      return "Empresas";
    case "Parceiro":
    case "Escritório parceiro":
    case "Parceiro corporativo":
      return "Parceiros";
    case "Instituição":
      return "Instituições";
    default:
      return labels.company;
  }
}

/** Abas de cadastros internos. */
export function buildCadastrosTabs(labels: NicheLabels, niche: NicheId) {
  const protocolsLabel =
    niche === "MEDICAL" || niche === "DENTAL" || niche === "VET"
      ? "Protocolos clínicos"
      : "Protocolos";

  return [
    { key: "patients" as const, label: labels.beneficiaries },
    { key: "companies" as const, label: companiesTabLabel(labels) },
    { key: "procedures" as const, label: labels.procedures },
    { key: "pricing" as const, label: "Precificação" },
    { key: "protocols" as const, label: protocolsLabel },
    { key: "users" as const, label: "Usuários" },
    { key: "operations" as const, label: "Mapa CRUD" },
  ];
}

export function cadastrosPageDescription(labels: NicheLabels): string {
  return `${labels.beneficiaries}, empresas, ${labels.procedures.toLowerCase()} e usuários do tenant.`;
}
