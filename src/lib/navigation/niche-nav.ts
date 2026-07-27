import type { NavTab } from "@/components/ui/NavTabs";
import type { InternoModule } from "@/lib/interno-permissions";
import type { NicheId, NicheLabels } from "@/lib/niche/types";

/** Rótulo do módulo de estoque por nicho (nav e título de página). */
export function estoqueTabLabel(niche: NicheId): string {
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
    case "CONSTRUCTION":
      return "Materiais de obra";
    default:
      return "Estoque";
  }
}

function estoqueShortLabel(niche: NicheId): string {
  switch (niche) {
    case "MEDICAL":
    case "DENTAL":
    case "VET":
      return "Estoque";
    case "CONSTRUCTION":
      return "Materiais";
    default:
      return estoqueTabLabel(niche);
  }
}

/** Encurta rótulos longos do dicionário de nicho para a faixa de abas. */
function compactLabel(label: string, max = 12): string {
  if (label.length <= max) return label;
  const first = label.split(/\s+/)[0];
  return first && first.length >= 3 ? first : label.slice(0, max);
}

/** Abas do portal interno com termos do nicho. */
export function buildInternoNavTabs(labels: NicheLabels, niche: NicheId): NavTab[] {
  const tabs: NavTab[] = [
    {
      href: "/interno/dashboard",
      label: "Dashboard",
      shortLabel: "Home",
      key: "dashboard" as InternoModule,
      group: "Operação",
      priority: "primary",
    },
    {
      href: "/interno",
      label: "Faturamento",
      shortLabel: "Faturas",
      key: "billing",
      group: "Financeiro",
      priority: "primary",
    },
    {
      href: "/interno/agenda",
      label: labels.appointments,
      shortLabel: compactLabel(labels.appointment),
      key: "agenda",
      group: "Operação",
      priority: "primary",
    },
    {
      href: "/interno/cadastros",
      label: `Cadastros · ${labels.beneficiaries}`,
      shortLabel: "Cadastros",
      key: "cadastros",
      group: "Operação",
      priority: "primary",
    },
    {
      href: "/interno/estoque",
      label: estoqueTabLabel(niche),
      shortLabel: estoqueShortLabel(niche),
      key: "estoque",
      group: "Operação",
      priority: "primary",
    },
    {
      href: "/interno/crm",
      label: "CRM Corporativo",
      shortLabel: "CRM",
      key: "crm",
      group: "Financeiro",
      priority: "primary",
    },
  ];

  if (niche === "CONSTRUCTION") {
    tabs.push({
      href: "/interno/projetos",
      label: labels.patients,
      shortLabel: compactLabel(labels.patient),
      key: "projetos",
      group: "Operação",
      priority: "primary",
    });
  }

  if (niche === "MEDICAL" || niche === "DENTAL") {
    tabs.push({
      href: "/interno/gestao",
      label: "Gestão clínica",
      shortLabel: "Gestão",
      key: "gestao",
      group: "Operação",
      priority: "primary",
    });
  }

  tabs.push(
    {
      href: "/interno/assinaturas",
      label: "Recorrência",
      shortLabel: "Recorr.",
      key: "subscriptions",
      group: "Financeiro",
      priority: "secondary",
    },
    {
      href: "/interno/comunicacao",
      label: "Comunicação",
      shortLabel: "Comunicação",
      key: "comunicacao",
      group: "Administração",
      priority: "secondary",
    },
    {
      href: "/interno/relatorios",
      label: "Relatórios",
      shortLabel: "Relatórios",
      key: "relatorios",
      group: "Financeiro",
      priority: "secondary",
    },
    {
      href: "/interno/auditoria",
      label: "Auditoria",
      shortLabel: "Auditoria",
      key: "auditoria",
      group: "Administração",
      priority: "secondary",
    },
    {
      href: "/interno/branding",
      label: "White Label",
      shortLabel: "Marca",
      key: "branding",
      group: "Administração",
      priority: "secondary",
    },
    {
      href: "/interno/integracoes",
      label: "Integrações",
      shortLabel: "Integrações",
      key: "integracoes",
      group: "Administração",
      priority: "secondary",
    },
    {
      href: "/interno/seguranca",
      label: "Segurança",
      shortLabel: "Segurança",
      key: "seguranca",
      group: "Administração",
      priority: "secondary",
    },
    {
      href: "/interno/assistente",
      label: "Assistente",
      shortLabel: "Assistente",
      key: "assistente",
      group: "Administração",
      priority: "secondary",
    },
  );

  return tabs;
}

/** Abas do prestador com termos do nicho. */
export function buildPrestadorNavTabs(labels: NicheLabels, niche?: NicheId): NavTab[] {
  const tabs: NavTab[] = [
    {
      href: "/prestador/dashboard",
      label: "Início",
      shortLabel: "Início",
      key: "dashboard",
      group: "Agenda",
      priority: "primary",
    },
  ];

  if (niche === "CONSTRUCTION") {
    tabs.push({
      href: "/prestador/campo",
      label: "Campo",
      shortLabel: "Campo",
      key: "campo",
      group: "Agenda",
      priority: "primary",
    });
  }

  tabs.push(
    {
      href: "/prestador",
      label: "Agenda",
      shortLabel: "Agenda",
      key: "agenda",
      group: "Agenda",
      priority: "primary",
    },
    {
      href: "/prestador/disponibilidade",
      label: "Disponibilidade",
      shortLabel: "Horários",
      key: "disponibilidade",
      group: "Agenda",
      priority: "primary",
    },
    {
      href: "/prestador/pacientes",
      label: labels.beneficiaries,
      shortLabel: compactLabel(labels.beneficiary),
      key: "pacientes",
      group: "Agenda",
      priority: "primary",
    },
    {
      href: "/prestador/extrato",
      label: "Extrato",
      shortLabel: "Extrato",
      key: "extrato",
      group: "Financeiro",
      priority: "primary",
    },
    {
      href: "/prestador/relatorios",
      label: "Relatórios",
      shortLabel: "Relatórios",
      key: "relatorios",
      group: "Financeiro",
      priority: "primary",
    },
  );

  return tabs;
}

/** Abas do beneficiário com termos do nicho. */
export function buildBeneficiarioNavTabs(labels: NicheLabels, niche?: NicheId): NavTab[] {
  if (niche === "CONSTRUCTION") {
    return [
      {
        href: "/beneficiario/obras",
        label: labels.patients,
        shortLabel: compactLabel(labels.patient),
        key: "obras",
        group: "Obra",
        priority: "primary",
      },
      {
        href: "/beneficiario/resumo",
        label: "Resumo",
        shortLabel: "Resumo",
        key: "resumo",
        group: "Conta",
        priority: "primary",
      },
      {
        href: "/beneficiario/faturas",
        label: "Faturas",
        shortLabel: "Faturas",
        key: "faturas",
        group: "Conta",
        priority: "primary",
      },
      {
        href: "/beneficiario/historico",
        label: "Histórico",
        shortLabel: "Histórico",
        key: "historico",
        group: "Conta",
        priority: "secondary",
      },
    ];
  }

  return [
    {
      href: "/beneficiario/agendar",
      label: "Agendar",
      shortLabel: "Agendar",
      key: "agendar",
      group: "Agenda",
      priority: "primary",
    },
    {
      href: "/beneficiario/resumo",
      label: "Resumo",
      shortLabel: "Resumo",
      key: "resumo",
      group: "Agenda",
      priority: "primary",
    },
    {
      href: "/beneficiario/agenda",
      label: "Agenda",
      shortLabel: "Agenda",
      key: "agenda",
      group: "Agenda",
      priority: "primary",
    },
    {
      href: "/beneficiario/consumo",
      label: "Consumo",
      shortLabel: "Consumo",
      key: "consumo",
      group: "Conta",
      priority: "primary",
    },
    {
      href: "/beneficiario/faturas",
      label: "Faturas",
      shortLabel: "Faturas",
      key: "faturas",
      group: "Conta",
      priority: "primary",
    },
    {
      href: "/beneficiario/documentos",
      label: "Documentos",
      shortLabel: "Guias",
      key: "documentos",
      group: "Clínico",
      priority: "primary",
    },
    {
      href: "/beneficiario/medicacoes",
      label: "Medicações",
      shortLabel: "Meds",
      key: "medicacoes",
      group: "Clínico",
      priority: "secondary",
    },
    {
      href: "/beneficiario/exames",
      label: "Exames",
      shortLabel: "Exames",
      key: "exames",
      group: "Clínico",
      priority: "secondary",
    },
    {
      href: "/beneficiario/plano",
      label: "Plano",
      shortLabel: "Plano",
      key: "plano",
      group: "Conta",
      priority: "secondary",
    },
    {
      href: "/beneficiario/assinatura",
      label: "Assinatura",
      shortLabel: "Assinatura",
      key: "assinatura",
      group: "Conta",
      priority: "secondary",
    },
    {
      href: "/beneficiario/prontuario",
      label: labels.medicalRecord,
      shortLabel: compactLabel(labels.medicalRecord),
      key: "prontuario",
      group: "Clínico",
      priority: "secondary",
    },
    {
      href: "/beneficiario/historico",
      label: "Histórico",
      shortLabel: "Histórico",
      key: "historico",
      group: "Conta",
      priority: "secondary",
    },
  ];
}

/** Seções do portal PJ. */
export function buildPjSectionNav(labels: NicheLabels, niche?: NicheId) {
  const sections: { id: string; label: string; shortLabel?: string; href?: string }[] = [
    { id: "resumo", label: "Resumo", shortLabel: "Resumo" },
    { id: "agendar", label: "Agendar", shortLabel: "Agendar" },
    { id: "beneficiarios", label: labels.beneficiaries, shortLabel: compactLabel(labels.beneficiary) },
    { id: "assinaturas", label: "Assinaturas", shortLabel: "Assinaturas" },
    { id: "faturas", label: "Faturas", shortLabel: "Faturas" },
  ];
  if (niche === "CONSTRUCTION") {
    sections.splice(1, 0, {
      id: "projetos",
      label: labels.patients,
      shortLabel: compactLabel(labels.patient),
      href: "/pj/projetos",
    });
  }
  return sections;
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
    {
      key: "patients" as const,
      label: labels.beneficiaries,
      shortLabel: compactLabel(labels.beneficiary),
    },
    ...(niche === "VET"
      ? [
          {
            key: "pets" as const,
            label: labels.patients,
            shortLabel: compactLabel(labels.patient),
          },
        ]
      : []),
    { key: "companies" as const, label: companiesTabLabel(labels), shortLabel: "Empresas" },
    {
      key: "procedures" as const,
      label: labels.procedures,
      shortLabel: compactLabel(labels.procedure),
    },
    { key: "pricing" as const, label: "Precificação", shortLabel: "Preços" },
    { key: "protocols" as const, label: protocolsLabel, shortLabel: "Protocolos" },
    { key: "users" as const, label: "Usuários", shortLabel: "Usuários" },
    { key: "operations" as const, label: "Mapa CRUD", shortLabel: "CRUD" },
  ];
}

export function cadastrosPageDescription(labels: NicheLabels): string {
  return `${labels.beneficiaries}, empresas, ${labels.procedures.toLowerCase()} e usuários do tenant.`;
}
