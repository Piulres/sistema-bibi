import type { OnboardingContext, OnboardingStep } from "../types";

export function buildInternoTour(ctx: OnboardingContext): OnboardingStep[] {
  const { labels } = ctx;

  const steps: OnboardingStep[] = [
    {
      id: "welcome",
      target: '[data-tour-id="portal-header"]',
      title: "Bem-vindo ao portal interno",
      content:
        "Este é o centro de operação da plataforma. Aqui você gerencia faturamento, agenda, cadastros e configurações do tenant.",
      placement: "bottom",
    },
    {
      id: "navigation",
      target: '[data-tour-id="portal-nav"]',
      title: "Módulos de operação",
      content:
        "Use as abas para alternar entre Dashboard, Faturamento, Agenda, Cadastros e demais módulos. No celular, toque em «Módulos» para abrir o menu.",
      placement: "bottom",
    },
    {
      id: "dashboard",
      target: '[data-tour-id="portal-content"]',
      title: "Dashboard executivo",
      content:
        "Acompanhe KPIs de receita, volume de atendimentos e indicadores operacionais em tempo real.",
      placement: "top",
      route: "/interno/dashboard",
    },
    {
      id: "billing",
      target: '[data-tour-id="portal-content"]',
      title: "Faturamento Pay Per Use",
      content:
        `Gerencie lotes de faturamento, aprovações e cobranças PIX dos ${labels.procedures.toLowerCase()} realizados.`,
      placement: "top",
      route: "/interno",
    },
    {
      id: "agenda",
      target: '[data-tour-id="portal-content"]',
      title: `Agenda de ${labels.appointments.toLowerCase()}`,
      content:
        `Visualize e gerencie ${labels.appointments.toLowerCase()}, incluindo walk-in de particulares e encaixes.`,
      placement: "top",
      route: "/interno/agenda*",
    },
    {
      id: "cadastros",
      target: '[data-tour-id="portal-content"]',
      title: `Cadastros · ${labels.beneficiaries}`,
      content:
        `Mantenha ${labels.providers.toLowerCase()}, ${labels.patients.toLowerCase()}, empresas e tabelas de preço atualizados.`,
      placement: "top",
      route: "/interno/cadastros*",
    },
    {
      id: "content",
      target: '[data-tour-id="portal-content"]',
      title: "Área de trabalho",
      content:
        "O conteúdo principal aparece aqui. Cada módulo traz filtros, tabelas e ações contextuais.",
      placement: "top",
    },
    {
      id: "assistant",
      target: '[data-tour-id="portal-assistant"]',
      title: "Assistente inteligente",
      content:
        "Precisa de ajuda? Toque no botão flutuante para conversar com o assistente sobre a página atual.",
      placement: "left",
    },
  ];

  return steps;
}
