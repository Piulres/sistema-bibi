import type { OnboardingContext, OnboardingStep } from "../types";

export function buildPrestadorTour(ctx: OnboardingContext): OnboardingStep[] {
  const { labels } = ctx;

  return [
    {
      id: "welcome",
      target: '[data-tour-id="portal-header"]',
      title: `Portal do ${labels.provider}`,
      content:
        `Bem-vindo! Este portal é sua central de ${labels.appointments.toLowerCase()}, prontuário e extrato financeiro.`,
      placement: "bottom",
    },
    {
      id: "navigation",
      target: '[data-tour-id="portal-nav"]',
      title: "Navegação rápida",
      content:
        `Alterne entre Início, Agenda, ${labels.patients}, Extrato e Relatórios. No celular, abra o menu de módulos.`,
      placement: "bottom",
    },
    {
      id: "dashboard",
      target: '[data-tour-id="portal-content"]',
      title: "Painel do dia",
      content:
        `Veja ${labels.appointments.toLowerCase()} do dia, pendências e atalhos para iniciar atendimentos.`,
      placement: "top",
      route: "/prestador/dashboard",
    },
    {
      id: "agenda",
      target: '[data-tour-id="portal-content"]',
      title: "Sua agenda",
      content:
        `Confira horários, confirme presença e inicie o atendimento de cada ${labels.patient.toLowerCase()}.`,
      placement: "top",
      route: "/prestador",
    },
    {
      id: "content",
      target: '[data-tour-id="portal-content"]',
      title: "Área de trabalho",
      content: "Aqui você executa suas tarefas: atendimentos, consultas e relatórios.",
      placement: "top",
    },
    {
      id: "assistant",
      target: '[data-tour-id="portal-assistant"]',
      title: "Assistente",
      content: "Tire dúvidas sobre fluxos clínicos e navegação diretamente com o assistente.",
      placement: "left",
    },
  ];
}
