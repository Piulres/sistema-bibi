import type { PortalKey } from "@/lib/roles";
import type { NicheLabels } from "@/lib/niche/types";

export type PortalUiCopy = {
  title: string;
  subtitle: string;
  placeholder: string;
  loading: string;
  emptyIntro: string;
  emptyExamples: string[];
  suggestions: string[];
};

export function buildPortalUiCopy(portal: PortalKey, labels: NicheLabels): PortalUiCopy {
  switch (portal) {
    case "interno":
      return {
        title: "Assistente operacional",
        subtitle: `Agenda, cadastros e faturamento · ${labels.patient}s e ${labels.providers.toLowerCase()}`,
        placeholder: "Pergunte ou peça uma ação da operação…",
        loading: "Consultando a operação…",
        emptyIntro: "Pergunte em linguagem natural, por exemplo:",
        emptyExamples: [
          `Quantos ${labels.appointments.toLowerCase()} temos hoje?`,
          "Qual a receita de ontem?",
          "Quem está devendo?",
          "Resumo do dashboard",
        ],
        suggestions: [
          `${labels.appointments} de hoje`,
          `Quantos ${labels.appointments.toLowerCase()} temos hoje?`,
          "Receita de ontem",
          "Quanto faturamos hoje?",
          "Quem está devendo?",
          "Resumo do dashboard",
          `Buscar ${labels.patient.toLowerCase()} João`,
          "Como faturar?",
          `Marcar ${labels.appointment.toLowerCase()}`,
          "Listar prestadores",
        ],
      };
    case "prestador":
      return {
        title: "Assistente clínico",
        subtitle: `Sua agenda, ${labels.patients.toLowerCase()} e extrato`,
        placeholder: "Pergunte sobre sua agenda ou carteira…",
        loading: "Consultando sua agenda…",
        emptyIntro: `Olá! Posso ajudar com sua agenda e ${labels.patients.toLowerCase()}:`,
        emptyExamples: [
          "Minha agenda de hoje",
          `Quais ${labels.patients.toLowerCase()} atendi recentemente?`,
          "Extrato do mês",
          "Resumo do dashboard",
        ],
        suggestions: [
          "Minha agenda de hoje",
          "O que tenho hoje?",
          "Próximo atendimento",
          `Meus ${labels.patients.toLowerCase()}`,
          "Extrato do mês",
          "Quanto recebi?",
          "Resumo do dashboard",
          "Como registrar procedimento?",
        ],
      };
    case "pj":
      return {
        title: "Assistente RH / financeiro",
        subtitle: `${labels.beneficiaries}, assinaturas e faturas corporativas`,
        placeholder: "Pergunte sobre a empresa ou contrato…",
        loading: "Consultando dados da empresa…",
        emptyIntro: "Pergunte sobre o contrato da empresa:",
        emptyExamples: [
          "Resumo da empresa",
          `${labels.beneficiaries} ativos`,
          "Faturas em aberto",
          "Como funciona o plano?",
        ],
        suggestions: [
          "Resumo da empresa",
          "Visão geral",
          `${labels.beneficiaries} da empresa`,
          "Colaboradores ativos",
          "Faturas em aberto",
          "O que devemos?",
          "Assinaturas ativas",
          "Como incluir colaborador?",
        ],
      };
    case "beneficiario":
      return {
        title: "Assistente pessoal",
        subtitle: `Seus ${labels.appointments.toLowerCase()}, faturas e agendamento`,
        placeholder: "Pergunte sobre sua conta ou agende…",
        loading: "Consultando sua conta…",
        emptyIntro: "Posso ajudar com sua conta:",
        emptyExamples: [
          "Meu resumo",
          `Próximos ${labels.appointments.toLowerCase()}`,
          "Minhas faturas",
          `Agendar ${labels.appointment.toLowerCase()}`,
        ],
        suggestions: [
          "Meu resumo",
          `Próximos ${labels.appointments.toLowerCase()}`,
          "Minhas faturas",
          "O que devo?",
          "Horários disponíveis hoje",
          `Quero agendar ${labels.appointment.toLowerCase()}`,
          `Marcar ${labels.procedure.toLowerCase()}`,
          "Sem preferência de prestador",
          "Como pagar PIX?",
        ],
      };
    default:
      return buildPortalUiCopy("interno", labels);
  }
}
