import type { OnboardingContext, OnboardingStep } from "../types";

export function buildPjTour(ctx: OnboardingContext): OnboardingStep[] {
  const { labels } = ctx;

  return [
    {
      id: "welcome",
      target: '[data-tour-id="portal-header"]',
      title: `Portal da ${labels.company}`,
      content:
        `Gerencie ${labels.beneficiaries.toLowerCase()}, assinaturas e faturas da sua organização em um só lugar.`,
      placement: "bottom",
    },
    {
      id: "navigation",
      target: '[data-tour-id="portal-nav"]',
      title: "Seções da empresa",
      content:
        `Navegue entre Resumo, ${labels.beneficiaries}, Assinaturas e Faturas. As seções rolam na mesma página.`,
      placement: "bottom",
    },
    {
      id: "resumo",
      target: '[data-tour-id="section-resumo"]',
      title: "Resumo executivo",
      content:
        "Visão geral de vidas ativas, consumo do período e indicadores de utilização do plano.",
      placement: "bottom",
      route: "/pj",
    },
    {
      id: "beneficiarios",
      target: '[data-tour-id="section-beneficiarios"]',
      title: labels.beneficiaries,
      content:
        `Cadastre e acompanhe ${labels.beneficiaries.toLowerCase()} vinculados ao contrato corporativo.`,
      placement: "top",
      route: "/pj",
    },
    {
      id: "content",
      target: '[data-tour-id="portal-content"]',
      title: "Área de trabalho",
      content: "Todas as informações da empresa ficam nesta página — role ou use as abas acima.",
      placement: "top",
    },
    {
      id: "assistant",
      target: '[data-tour-id="portal-assistant"]',
      title: "Assistente",
      content: "Pergunte sobre gestão de vidas, faturas e assinaturas ao assistente.",
      placement: "left",
    },
  ];
}
