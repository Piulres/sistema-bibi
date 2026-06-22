import type { PortalKey } from "@/lib/roles";

export const LANDING_STATS = [
  { value: "4", label: "portais integrados", suffix: "" },
  { value: "Pay Per Use", label: "cobrança por uso real", suffix: "" },
  { value: "100%", label: "nuvem e multi-tenant", suffix: "" },
  { value: "LGPD", label: "conformidade nativa", suffix: "" },
] as const;

export const LANDING_FEATURES = [
  {
    id: "pay-per-use",
    title: "Pay Per Use inteligente",
    description:
      "Cobre apenas procedimentos efetivamente utilizados, com preço congelado no atendimento e transparência total para o beneficiário.",
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
      "Prestador, equipe interna, RH corporativo e beneficiário operam em experiências segregadas com dados unificados.",
  },
  {
    id: "pep",
    title: "Operação clínica completa",
    description:
      "Agenda, PEP com templates, telemedicina e fluxo atendimento → prontuário → faturamento em poucos cliques.",
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
      "White label por tenant, RBAC interno, MFA TOTP, webhooks com retry, TISS XML e API REST documentada.",
  },
] as const;

export const LANDING_STEPS = [
  {
    step: "01",
    title: "Agende e atenda",
    description:
      "Prestadores gerenciam agenda e PEP; beneficiários agendam online com slots disponíveis em tempo real.",
  },
  {
    step: "02",
    title: "Registre o uso",
    description:
      "Cada procedimento gera um snapshot de preço. Empresas PJ acompanham consumo e alertas de inadimplência.",
  },
  {
    step: "03",
    title: "Fature com clareza",
    description:
      "Faturamento Pay Per Use, PIX e assinaturas recorrentes — sem perda de informação entre operação e financeiro.",
  },
] as const;

export type LandingPortal = {
  href: string;
  key: PortalKey;
  description: string;
  audience: string;
};

export const LANDING_PORTALS: LandingPortal[] = [
  {
    href: "/login",
    key: "prestador",
    audience: "Médicos e profissionais",
    description: "Agenda inteligente, PEP com templates e telemedicina integrada.",
  },
  {
    href: "/interno/login",
    key: "interno",
    audience: "Equipe administrativa",
    description: "Dashboard, faturamento, CRM, assinaturas, comunicação e integrações.",
  },
  {
    href: "/pj/login",
    key: "pj",
    audience: "RH e gestores corporativos",
    description: "Contratos, beneficiários, consumo Pay Per Use e relatórios exportáveis.",
  },
  {
    href: "/beneficiario/login",
    key: "beneficiario",
    audience: "Pacientes e beneficiários",
    description: "Agendamento self-service, faturas, assinatura e histórico de consumo.",
  },
];

export const LANDING_FAQ = [
  {
    question: "O que é Pay Per Use no Sistema Bibi?",
    answer:
      "É o modelo em que o beneficiário paga somente pelos serviços efetivamente utilizados — consultas, exames e procedimentos — com valor transparente antes do atendimento e preço congelado no momento do uso.",
  },
  {
    question: "A plataforma suporta saúde corporativa (B2B)?",
    answer:
      "Sim. O Portal da Empresa (PJ) permite que RH acompanhe beneficiários, consumo, alertas de inadimplência e exporte relatórios, com precificação dinâmica por contrato corporativo.",
  },
  {
    question: "Posso usar minha própria marca (white label)?",
    answer:
      "Sim. Cada clínica cliente configura logo, cores, nome de exibição e domínio customizado. A operação e os dados são da clínica; a infraestrutura é Sistema Bibi.",
  },
  {
    question: "A solução está em conformidade com a LGPD?",
    answer:
      "A POC inclui fluxos de consentimento, exportação e exclusão de dados pessoais, além de trilha de auditoria por beneficiário — base para operação em conformidade com a LGPD.",
  },
] as const;

export const LANDING_TRUST_BADGES = [
  "Multi-tenant SaaS",
  "LGPD",
  "API REST",
  "White label",
  "MFA TOTP",
] as const;

export function buildLandingDescription(tagline: string | null): string {
  return (
    tagline ??
    "Plataforma SaaS que clínicas e operadoras usam para Pay Per Use, quatro portais integrados, faturamento previsível e white label com dados isolados por cliente."
  );
}
