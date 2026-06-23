import type { PortalKey } from "@/lib/roles";
import { getDefaultLabels, getNicheConfig } from "@/lib/niche/defaults";
import type { NicheId } from "@/lib/niche/types";
import { PLATFORM } from "@/lib/platform";
import { appendSegmentToPath } from "@/lib/segment/types";

export type LandingFeature = {
  id: "pay-per-use" | "pricing" | "portals" | "operations" | "billing" | "enterprise";
  title: string;
  description: string;
};

export type LandingStep = {
  step: string;
  title: string;
  description: string;
};

export type LandingPortal = {
  href: string;
  key: PortalKey;
  description: string;
  audience: string;
};

export type LandingFaqItem = {
  question: string;
  answer: string;
};

export type NicheLandingContent = {
  featuresSection: { title: string; description: string };
  features: LandingFeature[];
  steps: LandingStep[];
  portals: LandingPortal[];
  faq: LandingFaqItem[];
  footerTagline: string;
  ctaDescription: string;
};

function buildPortals(
  labels: ReturnType<typeof getDefaultLabels>,
  segment?: { tenantSlug?: string | null; niche?: NicheId },
): LandingPortal[] {
  const segmentOpts = segment ?? {};
  return [
    {
      href: appendSegmentToPath("/login", segmentOpts),
      key: "prestador",
      audience: labels.providers,
      description: `Agenda inteligente, registro de ${labels.procedures.toLowerCase()} e fluxo de atendimento integrado.`,
    },
    {
      href: appendSegmentToPath("/interno/login", segmentOpts),
      key: "interno",
      audience: "Equipe administrativa",
      description: "Dashboard, faturamento, CRM, assinaturas, comunicação e integrações.",
    },
    {
      href: appendSegmentToPath("/pj/login", segmentOpts),
      key: "pj",
      audience: `RH e gestores — ${labels.company.toLowerCase()}`,
      description: `Contratos, ${labels.beneficiaries.toLowerCase()}, consumo Pay Per Use e relatórios exportáveis.`,
    },
    {
      href: appendSegmentToPath("/beneficiario/login", segmentOpts),
      key: "beneficiario",
      audience: labels.beneficiaries,
      description: `Agendamento self-service, faturas, assinatura e histórico de consumo.`,
    },
  ];
}

/** Conteúdo da landing parametrizado por nicho (ServiceOS v2.0). */
export function getNicheLandingContent(
  niche: NicheId,
  segment?: { tenantSlug?: string | null },
): NicheLandingContent {
  const config = getNicheConfig(niche);
  const labels = config.labels;
  const sector = config.name.toLowerCase();

  const operationsFeature: LandingFeature = {
    id: "operations",
    title:
      niche === "MEDICAL"
        ? "Operação clínica completa"
        : niche === "LEGAL"
          ? "Gestão jurídica integrada"
          : `Operação de ${sector} completa`,
    description:
      niche === "MEDICAL"
        ? "Agenda, PEP com templates, telemedicina e fluxo atendimento → prontuário → faturamento em poucos cliques."
        : niche === "LEGAL"
          ? "Agenda, dossiê do cliente, registro de horas técnicas e fluxo atendimento → faturamento em poucos cliques."
          : `Agenda, ${labels.medicalRecord.toLowerCase()}, registro de ${labels.procedures.toLowerCase()} e fluxo atendimento → faturamento em poucos cliques.`,
  };

  return {
    featuresSection: {
      title:
        niche === "MEDICAL"
          ? "Tudo que clínicas, hospitais e saúde corporativa precisam"
          : `Tudo que operações de ${sector} precisam`,
      description: `Da operação ao faturamento Pay Per Use — uma plataforma unificada com portais segregados e dados conectados em tempo real.`,
    },
    features: [
      {
        id: "pay-per-use",
        title: "Pay Per Use inteligente",
        description: `Cobre apenas ${labels.procedures.toLowerCase()} efetivamente utilizados, com preço congelado no atendimento e transparência total para o ${labels.beneficiary.toLowerCase()}.`,
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
        description: `${labels.provider}, equipe interna, ${labels.company.toLowerCase()} e ${labels.beneficiary.toLowerCase()} operam em experiências segregadas com dados unificados.`,
      },
      operationsFeature,
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
          niche === "MEDICAL"
            ? "White label por tenant, RBAC interno, MFA TOTP, webhooks com retry, TISS XML e API REST documentada."
            : "White label por tenant, RBAC interno, MFA TOTP, webhooks com retry e API REST documentada.",
      },
    ],
    steps: [
      {
        step: "01",
        title: `Agende e atenda`,
        description: `${labels.providers} gerenciam agenda e ${labels.medicalRecord.toLowerCase()}; ${labels.beneficiaries.toLowerCase()} agendam online com slots disponíveis em tempo real.`,
      },
      {
        step: "02",
        title: "Registre o uso",
        description: `Cada ${labels.procedure.toLowerCase()} gera um snapshot de preço. Empresas PJ acompanham consumo e alertas de inadimplência.`,
      },
      {
        step: "03",
        title: "Fature com clareza",
        description:
          "Faturamento Pay Per Use, PIX e assinaturas recorrentes — sem perda de informação entre operação e financeiro.",
      },
    ],
    portals: buildPortals(labels, { tenantSlug: segment?.tenantSlug, niche }),
    faq: [
      {
        question: `O que é Pay Per Use no ${PLATFORM.name}?`,
        answer: `É o modelo em que o ${labels.beneficiary.toLowerCase()} paga somente pelos serviços efetivamente utilizados — ${labels.procedures.toLowerCase()} — com valor transparente antes do atendimento e preço congelado no momento do uso.`,
      },
      {
        question: "A plataforma suporta contratos corporativos (B2B)?",
        answer: `Sim. O Portal da Empresa (PJ) permite que gestores acompanhem ${labels.beneficiaries.toLowerCase()}, consumo, alertas de inadimplência e exportem relatórios, com precificação dinâmica por contrato.`,
      },
      {
        question: "Posso usar minha própria marca (white label)?",
        answer: `Sim. Cada operação configura logo, cores, nome de exibição e domínio customizado. Os dados são do cliente; a infraestrutura é ${PLATFORM.name}.`,
      },
      {
        question: "A solução está em conformidade com a LGPD?",
        answer: `A POC inclui fluxos de consentimento, exportação e exclusão de dados pessoais, além de trilha de auditoria por ${labels.beneficiary.toLowerCase()} — base para operação em conformidade com a LGPD.`,
      },
      {
        question: "O mesmo sistema atende outros nichos além de saúde?",
        answer:
          `Sim. O ${PLATFORM.name} parametriza nomenclatura e identidade visual por nicho — veterinária, odontologia, jurídico, bem-estar e educação — sem alterar o motor de faturamento Pay Per Use.`,
      },
    ],
    footerTagline: `${PLATFORM.name} Pay Per Use para ${sector} — operação, ${labels.procedures.toLowerCase()} e faturamento integrados.`,
    ctaDescription: `Explore a demonstração com os quatro portais, fluxo Pay Per Use e white label configurável para cada operação de ${sector}.`,
  };
}
