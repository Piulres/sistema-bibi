import { PLATFORM } from "@/lib/platform";
import { SALES_SITE_SECTIONS } from "@/lib/platform/structure";
import type { LandingFeature, LandingFaqItem, LandingStep } from "@/lib/niche/landing-content";

const PURPOSE_SECTION = SALES_SITE_SECTIONS.find((s) => s.id === "propositos")!;
const AUDIENCE_SECTION = SALES_SITE_SECTIONS.find((s) => s.id === "para-quem")!;

/** Conteúdo da home — narrativa comercial alinhada a `docs/comercial/` e páginas de segmento. */
export const HOME_HERO = {
  badge: `${PLATFORM.shortName} · Infraestrutura Pay Per Use`,
  headline: "Pare de pagar por elegibilidade.",
  headlineAccent: "Cobre só pelo que foi usado.",
  description:
    "Conecte empresa, prestador e cliente final em quatro portais integrados — o RH audita cada consulta, sessão ou serviço com preço congelado no atendimento.",
  subline:
    "Saúde, veterinária, odontologia, jurídico, bem-estar, educação e engenharia na mesma operação digital — com white label e vocabulário do seu segmento.",
  roiHighlight: "Até ~87% de economia",
  roiDetail: "vs. plano fechado · cenário 500 vidas, 15% de utilização",
} as const;

export const HOME_PROBLEM = {
  eyebrow: "O problema",
  title: "Gestão de serviços profissionais ainda é uma caixa preta",
  description:
    "Planos fechados, sistemas desconectados e falta de visibilidade corroem margem — em qualquer nicho de serviço.",
  items: [
    {
      title: "Sinistralidade opaca",
      description:
        "Planos fechados cobram por elegibilidade, não por uso real — o RH paga por centenas de vidas que nunca consultam.",
    },
    {
      title: "Operação fragmentada",
      description:
        "Agenda, registro, faturamento e portais do cliente em sistemas desconectados geram retrabalho e perda de receita.",
    },
    {
      title: "Plataforma genérica demais",
      description:
        "ERPs verticais não escalam para múltiplos nichos; soluções de benefício não adaptam vocabulário nem identidade por segmento.",
    },
  ],
} as const;

export const HOME_SOLUTION = {
  eyebrow: "A solução",
  title: "Um motor transacional, sete narrativas de mercado",
  description:
    "O Sistema Bibi - ServiceOS é infraestrutura horizontal Pay Per Use — mesma base para clínicas, pet shops, escritórios e escolas, com marca e vocabulário próprios por tenant.",
  items: [
    {
      icon: "pay-per-use" as const,
      title: "Pay Per Use nativo",
      description:
        "Cada serviço registrado gera Price Snapshot — transparência total para RH, operação e cliente final.",
    },
    {
      icon: "portals" as const,
      title: "Quatro portais integrados",
      description:
        "Prestador, interno, empresa e beneficiário compartilham a mesma base de dados em tempo real.",
    },
    {
      icon: "enterprise" as const,
      title: "Multi-nicho e white label",
      description:
        "Sete segmentos com labels automáticos, paleta por nicho e identidade visual da sua operação.",
    },
  ],
} as const;

export const HOME_STEPS: LandingStep[] = [
  {
    step: "01",
    title: "Agende e atenda",
    description:
      "Prestadores gerenciam agenda e registro; clientes finais agendam online. A equipe interna coordena tudo em um único painel.",
  },
  {
    step: "02",
    title: "Registre o uso",
    description:
      "Cada procedimento, sessão ou hora técnica gera snapshot de preço. Empresas PJ acompanham consumo linha a linha em tempo real.",
  },
  {
    step: "03",
    title: "Fature com clareza",
    description:
      "Faturamento Pay Per Use, PIX e assinaturas recorrentes — sem perda de informação entre operação e financeiro.",
  },
];

export const HOME_HOW_IT_WORKS = {
  eyebrow: "Como funciona",
  title: "Do agendamento ao faturamento em três etapas",
  description:
    "Fluxos curtos e integrados — o mesmo padrão das páginas de segmento, válido para qualquer nicho de serviço profissional.",
} as const;

export const HOME_AUDIENCE = {
  title: "Para operações que precisam de transparência financeira",
  description:
    "De programas corporativos de benefícios a redes credenciadas — um motor transacional com a cara da sua marca.",
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

export const HOME_FEATURES_SECTION = {
  title: "Tudo que conecta operação e faturamento",
  description:
    "Da agenda ao fechamento Pay Per Use — uma plataforma unificada com dados conectados em tempo real, independente do segmento de mercado.",
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
    answer: `Infraestrutura horizontal Pay Per Use que conecta empresas, prestadores e clientes finais em serviços profissionais — clínicas, pet shops, consultórios, escritórios, spas e escolas usam a mesma base com identidade e vocabulário próprios.`,
  },
  {
    question: "Em que o ServiceOS difere de um ERP vertical ou operadora digital?",
    answer:
      "ERPs focam na operação de um nicho; operadoras vendem plano fechado. O ServiceOS une motor transacional Pay Per Use, quatro portais segregados e white label multi-nicho — você cobra pelo uso real, não por elegibilidade.",
  },
  {
    question: "Como a plataforma atende diferentes segmentos?",
    answer:
      "Cada nicho tem landing dedicada com demonstração segmentada — labels automáticos na UI, paleta visual própria e portais pré-configurados para o tenant demo daquele vertical.",
  },
  {
    question: "Posso usar minha própria marca (white label)?",
    answer: `Sim. Cada tenant configura logo, cores, nome de exibição e domínio customizado. Os dados são do cliente; a infraestrutura é ${PLATFORM.name}.`,
  },
  {
    question: "Como acesso a demonstração do meu segmento?",
    answer:
      "Use a seção Segmentos nesta página ou o menu principal — cada vertical tem landing própria com portais pré-configurados para o tenant demo daquele nicho.",
  },
];

export const HOME_CTA =
  "Escolha seu segmento, explore os quatro portais em ação e veja o fluxo Pay Per Use com white label configurável.";

export const HOME_FOOTER_TAGLINE =
  "Infraestrutura Pay Per Use multi-nicho — empresa, prestador e cliente na mesma operação.";
