import type { PortalKey } from "@/lib/roles";
import type { NicheLabels } from "@/lib/niche/types";

/** Chips extras por rota — padrão copiloto contextual (Notion AI, Salesforce Einstein). */
export function getPageContextSuggestions(
  portal: PortalKey,
  pathname: string,
  labels: NicheLabels,
): string[] {
  const path = pathname.split("?")[0] ?? pathname;

  if (portal === "interno") {
    if (path.includes("/agenda")) {
      return [
        `${labels.appointments} de hoje`,
        `Marcar ${labels.appointment.toLowerCase()}`,
        "Listar prestadores",
      ];
    }
    if (path.includes("/cadastros")) {
      return [
        `Buscar ${labels.patient.toLowerCase()} João`,
        `Cadastrar ${labels.patient.toLowerCase()}`,
        "Listar usuários",
      ];
    }
    if (path === "/interno" || path.includes("/fatur")) {
      return ["Quem está devendo?", "Receita de ontem", "Como faturar?"];
    }
    if (path.includes("/dashboard")) {
      return ["Resumo do dashboard", "Como está a operação?", `${labels.appointments} de hoje`];
    }
    if (path.includes("/relatorios")) {
      return ["Receita do mês", "Panorama financeiro", "Quanto faturamos ontem?"];
    }
  }

  if (portal === "prestador") {
    if (path.includes("/extrato")) {
      return ["Extrato do mês", "Quanto recebi?", "Resumo do dashboard"];
    }
    return ["Minha agenda de hoje", `Meus ${labels.patients.toLowerCase()}`, "Próximo atendimento"];
  }

  if (portal === "pj") {
    return ["Faturas em aberto", "Resumo da empresa", `${labels.beneficiaries} ativos`];
  }

  if (portal === "beneficiario") {
    if (path.includes("/agendar")) {
      return [
        "Horários disponíveis hoje",
        `Quero agendar ${labels.appointment.toLowerCase()}`,
        "Sem preferência de prestador",
      ];
    }
    if (path.includes("/fatura")) {
      return ["Minhas faturas", "O que devo?", "Como pagar PIX?"];
    }
    return ["Meu resumo", `Próximos ${labels.appointments.toLowerCase()}`, `Agendar ${labels.appointment.toLowerCase()}`];
  }

  return [];
}
