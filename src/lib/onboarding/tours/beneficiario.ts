import type { OnboardingContext, OnboardingStep } from "../types";

export function buildBeneficiarioTour(ctx: OnboardingContext): OnboardingStep[] {
  const { labels } = ctx;

  return [
    {
      id: "welcome",
      target: '[data-tour-id="portal-header"]',
      title: `Portal do ${labels.beneficiary}`,
      content:
        `Acesse sua agenda, agende ${labels.appointments.toLowerCase()} e acompanhe consumo e faturas.`,
      placement: "bottom",
    },
    {
      id: "navigation",
      target: '[data-tour-id="portal-nav"]',
      title: "Menu principal",
      content:
        "Use as abas para Agendar, ver Resumo, Agenda, Consumo, Faturas e seu prontuário.",
      placement: "bottom",
    },
    {
      id: "agendar",
      target: '[data-tour-id="portal-content"]',
      title: `Agendar ${labels.appointment.toLowerCase()}`,
      content:
        `Escolha ${labels.provider.toLowerCase()}, data e horário para sua próxima ${labels.appointment.toLowerCase()}.`,
      placement: "top",
      route: "/beneficiario/agendar*",
    },
    {
      id: "resumo",
      target: '[data-tour-id="portal-content"]',
      title: "Resumo da jornada",
      content:
        "Acompanhe próximos compromissos, status do plano e etapas da sua jornada de cuidado.",
      placement: "top",
      route: "/beneficiario/resumo",
    },
    {
      id: "content",
      target: '[data-tour-id="portal-content"]',
      title: "Área de trabalho",
      content: "Todo o conteúdo do portal aparece aqui conforme a aba selecionada.",
      placement: "top",
    },
    {
      id: "assistant",
      target: '[data-tour-id="portal-assistant"]',
      title: "Assistente",
      content: "Tire dúvidas sobre agendamento, plano e histórico com o assistente.",
      placement: "left",
    },
  ];
}
