import { PLATFORM } from "@/lib/platform";
import { SALES_SITE_SECTIONS } from "@/lib/platform/structure";
import type { LandingFeature, LandingFaqItem } from "@/lib/niche/landing-content";

const PURPOSE_SECTION = SALES_SITE_SECTIONS.find((s) => s.id === "propositos")!;
const AUDIENCE_SECTION = SALES_SITE_SECTIONS.find((s) => s.id === "para-quem")!;

/** Conteúdo da home — foco em captação (dor → solução → prova). */
export const HOME_HERO = {
  badge: `${PLATFORM.versionLabel} · Pay Per Use Multi-Nicho`,
  headline: "Pare de pagar por elegibilidade.",
  headlineAccent: "Cobre só pelo que foi usado.",
  description:
    "Plataforma Pay Per Use com quatro portais integrados — o RH audita cada consulta, sessão ou serviço em tempo real, com preço congelado no atendimento.",
  subline:
    "Saúde, veterinária, odontologia, jurídico, bem-estar e educação na mesma infraestrutura — com white label e vocabulário do seu segmento.",
  roiHighlight: "Até ~87% de economia",
  roiDetail: "vs. plano fechado · cenário 500 vidas, 15% de utilização",
} as const;

export const HOME_AUDIENCE = {
  title: "Feito para operações que precisam de transparência",
  description:
    "De clínicas credenciadas a programas corporativos de benefícios — um motor transacional com a cara da sua marca.",
  purpose: {
    title: PURPOSE_SECTION.title,
    description: PURPOSE_SECTION.description,
    bullets: PURPOSE_SECTION.bullets,
  },
  audience: {
    title: AUDIENCE_SECTION.title,
    description: AUDIENCE_SECTION.description,
    bullets: AUDIENCE_SECTION.bullets,
  },
} as const;

export const HOME_PRODUCT = {
  title: "O produto",
  description:
    "O Sistema Bibi - ServiceOS é a camada de infraestrutura sobre a qual cada operação monta sua marca. Pay Per Use nativo, faturamento sem perda de informação e portais segregados por perfil de acesso.",
  bullets: [
    "Quatro portais integrados: Prestador, Interno, Empresa e Beneficiário",
    "Cobrança por uso real — transparência total de consumo",
    "White label por tenant: logo, cores, domínio e nomenclatura",
    "API REST, webhooks, RBAC interno e MFA TOTP",
  ],
} as const;

export const HOME_VISION = SALES_SITE_SECTIONS.find((s) => s.id === "missao")!;
export const HOME_VALUES = SALES_SITE_SECTIONS.find((s) => s.id === "valor")!;

export const HOME_FEATURES_SECTION = {
  title: "Tudo que operações de serviços profissionais precisam",
  description:
    "Da agenda ao faturamento Pay Per Use — uma plataforma unificada com dados conectados em tempo real, independente do segmento de mercado.",
} as const;

export const HOME_FEATURES: LandingFeature[] = [
  {
    id: "pay-per-use",
    title: "Pay Per Use inteligente",
    description:
      "Cobre apenas serviços efetivamente utilizados, com preço congelado no atendimento e transparência total para beneficiários e gestores.",
  },
  {
    id: "pricing",
    title: "Precificação dinâmica B2B",
    description:
      "Regras por empresa ajustam multiplicadores corporativos — descontos e contratos sem retrabalho manual no faturamento.",
  },
  {
    id: "portals",
    title: "Quatro portais, uma plataforma",
    description:
      "Prestadores, equipe interna, empresas PJ e clientes finais operam em experiências segregadas com dados unificados.",
  },
  {
    id: "operations",
    title: "Operação completa por segmento",
    description:
      "Agenda, prontuário ou dossiê adaptável, registro de procedimentos e fluxo atendimento → faturamento em poucos cliques.",
  },
  {
    id: "billing",
    title: "Receita previsível",
    description:
      "Faturas, assinaturas, PIX e fechamento na alta. Dashboard executivo com KPIs de inadimplência e consumo.",
  },
  {
    id: "enterprise",
    title: "Enterprise-ready",
    description:
      "White label por tenant, RBAC interno, MFA TOTP, webhooks com retry, TISS XML (saúde) e API REST documentada.",
  },
];

export const HOME_FAQ: LandingFaqItem[] = [
  {
    question: `O que é o ${PLATFORM.name}?`,
    answer: `Infraestrutura horizontal Pay Per Use para operações de serviços profissionais — clínicas, pet shops, consultórios, escritórios, spas e escolas usam a mesma base com identidade e vocabulário próprios.`,
  },
  {
    question: "Como a plataforma atende diferentes segmentos?",
    answer:
      "Cada nicho (saúde, veterinária, odontologia, jurídico, bem-estar, educação) tem landing dedicada, labels automáticos na UI e paleta visual própria — Orange permanece como accent universal.",
  },
  {
    question: "Posso usar minha própria marca (white label)?",
    answer: `Sim. Cada tenant configura logo, cores, nome de exibição e domínio customizado. Os dados são do cliente; a infraestrutura é ${PLATFORM.name}.`,
  },
  {
    question: "A solução está em conformidade com a LGPD?",
    answer:
      "A POC inclui fluxos de consentimento, exportação e exclusão de dados pessoais, além de trilha de auditoria — base para operação em conformidade com a LGPD.",
  },
  {
    question: "Como acesso a demonstração do meu segmento?",
    answer:
      "Use a página Segmentos no menu principal — cada vertical tem landing própria com portais pré-configurados para o tenant demo daquele nicho.",
  },
];

export const HOME_CTA =
  "Veja os quatro portais em ação — fluxo Pay Per Use, white label e demonstração do seu segmento em poucos cliques.";

export const HOME_FOOTER_TAGLINE = PLATFORM.tagline;
