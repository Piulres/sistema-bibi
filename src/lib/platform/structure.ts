import { NICHE_MASTER_LABELS } from "@/constants/niches";
import { PORTALS } from "@/lib/roles";
import type { NicheId } from "@/lib/niche/types";
import { segmentTenantByNiche } from "@/lib/niche/demo-accounts";

/** Slug público da landing por segmento. */
export const SEGMENT_LANDING_SLUGS = {
  saude: "MEDICAL",
  veterinaria: "VET",
  odontologia: "DENTAL",
  juridico: "LEGAL",
  "bem-estar": "SPA",
  educacao: "EDUCATION",
  engenharia: "CONSTRUCTION",
} as const satisfies Record<string, NicheId>;

export type SegmentLandingSlug = keyof typeof SEGMENT_LANDING_SLUGS;

export const SEGMENT_LANDING_PAGES = Object.entries(SEGMENT_LANDING_SLUGS).map(
  ([slug, niche]) => ({
    slug: slug as SegmentLandingSlug,
    niche,
    href: `/segmentos/${slug}`,
    label: segmentPageLabel(niche),
    tenantSlug: segmentTenantByNiche(niche).slug,
  }),
);

function segmentPageLabel(niche: NicheId): string {
  const map: Record<NicheId, string> = {
    MEDICAL: "Página Saúde",
    VET: "Página Veterinária",
    DENTAL: "Página Odontológica",
    LEGAL: "Página Jurídica",
    SPA: "Página Bem-estar",
    EDUCATION: "Página Educação",
    CONSTRUCTION: "Página Engenharia",
  };
  return map[niche];
}

export type PlatformTreeNode = {
  id: string;
  label: string;
  description?: string;
  href?: string;
  children?: PlatformTreeNode[];
};

/** Módulos principais do portal interno (visão de negócio). */
const INTERNO_CORE_MODULES: PlatformTreeNode[] = [
  { id: "dashboard", label: "Dashboard", href: "/interno/dashboard" },
  { id: "billing", label: "Faturamento", href: "/interno" },
  { id: "agenda", label: "Agendamento", href: "/interno/agenda" },
  { id: "cadastros", label: "Cadastros", href: "/interno/cadastros" },
  { id: "crm", label: "CRM", href: "/interno/crm" },
];

/** Tipos de prestador por nicho (rótulo de acesso). */
const PRESTADOR_NICHE_ACCESS: PlatformTreeNode[] = (
  Object.keys(SEGMENT_LANDING_SLUGS) as SegmentLandingSlug[]
).map((slug) => {
  const niche = SEGMENT_LANDING_SLUGS[slug];
  const labels = NICHE_MASTER_LABELS[niche];
  const providerLabel =
    niche === "DENTAL"
      ? "Dentista"
      : niche === "EDUCATION"
        ? "Professor / Instrutor"
        : labels.provider;
  return {
    id: `prestador-${slug}`,
    label: providerLabel,
    href: `/login?tenant=${segmentTenantByNiche(niche).slug}`,
    description: labels.providers,
  };
});

/** Perfis de cliente final por nicho. */
const BENEFICIARIO_NICHE_ACCESS: PlatformTreeNode[] = (
  Object.keys(SEGMENT_LANDING_SLUGS) as SegmentLandingSlug[]
).map((slug) => {
  const niche = SEGMENT_LANDING_SLUGS[slug];
  const labels = NICHE_MASTER_LABELS[niche];
  const clientLabel =
    niche === "VET"
      ? "Tutores"
      : niche === "EDUCATION"
        ? "Alunos"
        : niche === "LEGAL" || niche === "SPA"
          ? "Clientes"
          : labels.patients;
  return {
    id: `beneficiario-${slug}`,
    label: clientLabel,
    href: `/beneficiario/login?tenant=${segmentTenantByNiche(niche).slug}`,
    description: labels.beneficiaries,
  };
});

/** Árvore canônica — Portal Sistema Bibi. */
export const PLATFORM_STRUCTURE: PlatformTreeNode = {
  id: "portal-sistema-bibi",
  label: "Portal Sistema Bibi",
  description: "Infraestrutura ServiceOS multi-nicho com quatro portais segregados.",
  children: [
    {
      id: "landing",
      label: "Portal Landing Page",
      description: "Demonstração comercial por segmento de mercado.",
      children: SEGMENT_LANDING_PAGES.map((page) => ({
        id: page.slug,
        label: page.label,
        href: page.href,
      })),
    },
    {
      id: "interno",
      label: "Portal Interno — Administração do Negócio",
      description: PORTALS.interno.label,
      href: PORTALS.interno.loginPath,
      children: [
        {
          id: "interno-access",
          label: "Acesso Equipe Administrativa",
          children: INTERNO_CORE_MODULES,
        },
      ],
    },
    {
      id: "prestador",
      label: "Portal do Prestador",
      description: PORTALS.prestador.label,
      href: PORTALS.prestador.loginPath,
      children: [
        {
          id: "prestador-access",
          label: "Acesso do Prestador",
          children: [
            ...PRESTADOR_NICHE_ACCESS,
            {
              id: "prestador-geral",
              label: "Profissionais",
              href: "/login",
              description: "Todos os prestadores do tenant ativo",
            },
          ],
        },
      ],
    },
    {
      id: "pj",
      label: "Portal Empresa — Programa de Beneficiários",
      description: PORTALS.pj.label,
      href: PORTALS.pj.loginPath,
      children: [
        {
          id: "pj-access",
          label: "Acesso Corporações, RH & Gestores",
          children: [
            { id: "pj-contratos", label: "Contratos", href: "/pj#assinaturas" },
            { id: "pj-consumo", label: "Consumo", href: "/pj#beneficiarios" },
            { id: "pj-relatorios", label: "Relatórios", href: "/pj#resumo" },
          ],
        },
      ],
    },
    {
      id: "beneficiario",
      label: "Portal Beneficiário",
      description: PORTALS.beneficiario.label,
      href: PORTALS.beneficiario.loginPath,
      children: [
        {
          id: "beneficiario-access",
          label: "Acesso do Cliente Final",
          children: BENEFICIARIO_NICHE_ACCESS,
        },
      ],
    },
  ],
};

export type SalesSiteSection = {
  id: string;
  label: string;
  anchor: string;
  title: string;
  description: string;
  bullets: string[];
};

/** Site para venda do Sistema Bibi — seções comerciais. */
export const SALES_SITE_SECTIONS: SalesSiteSection[] = [
  {
    id: "propositos",
    label: "Propósitos",
    anchor: "propositos",
    title: "Por que o Sistema Bibi existe",
    description:
      "Eliminar a caixa preta da sinistralidade e dar transparência total ao ciclo de receita em serviços profissionais.",
    bullets: [
      "Cobrar apenas pelo uso real (Pay Per Use)",
      "Unificar operação, faturamento e portais do cliente",
      "Escalar horizontalmente para qualquer nicho de serviço",
      "White label por tenant sem fork de código",
    ],
  },
  {
    id: "para-quem",
    label: "Para quem",
    anchor: "para-quem",
    title: "Quem se beneficia da plataforma",
    description:
      "Operações de serviços profissionais que precisam de gestão integrada e modelo de receita previsível.",
    bullets: [
      "Clínicas, operadoras e redes de saúde",
      "Pet shops e clínicas veterinárias",
      "Consultórios odontológicos e jurídicos",
      "Spas, estúdios de bem-estar e escolas",
      "Construtoras, empreiteiras e escritórios de engenharia",
      "RH corporativo com programa de beneficiários",
    ],
  },
  {
    id: "missao",
    label: "Missão",
    anchor: "missao",
    title: "Nossa missão",
    description:
      "Ser a infraestrutura horizontal de referência para faturamento Pay Per Use em serviços profissionais no Brasil.",
    bullets: [
      "Tecnologia brasileira com identidade Energia Brasileira",
      "Conformidade LGPD nativa",
      "Quatro portais integrados por perfil de acesso",
      "Demonstração multi-nicho em uma única plataforma",
    ],
  },
  {
    id: "valor",
    label: "Valor",
    anchor: "valor",
    title: "Valor entregue",
    description:
      "ROI demonstrável, transparência de consumo e redução de custo operacional para empresas de médio porte.",
    bullets: [
      "Até 87% de economia vs. plano fechado tradicional",
      "Auditoria de cada procedimento pelo RH",
      "Faturamento sem perda entre operação e financeiro",
      "API REST e integrações enterprise",
    ],
  },
];

export function isSegmentLandingSlug(slug: string): slug is SegmentLandingSlug {
  return slug in SEGMENT_LANDING_SLUGS;
}

export function nicheFromSegmentSlug(slug: string): NicheId | null {
  if (!isSegmentLandingSlug(slug)) return null;
  return SEGMENT_LANDING_SLUGS[slug];
}

export function segmentSlugFromNiche(niche: NicheId): SegmentLandingSlug {
  const entry = SEGMENT_LANDING_PAGES.find((p) => p.niche === niche);
  return entry?.slug ?? "saude";
}

export function segmentLandingHref(niche: NicheId): string {
  return `/segmentos/${segmentSlugFromNiche(niche)}`;
}
