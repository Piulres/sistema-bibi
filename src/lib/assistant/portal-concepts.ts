import "server-only";
import type { Role } from "@/lib/roles";
import type { NicheLabels } from "@/lib/niche/types";
import type { PortalKey } from "@/lib/roles";
import { PORTALS } from "@/lib/roles";

export function roleToPortalKey(role: Role): PortalKey {
  switch (role) {
    case "PRESTADOR":
      return "prestador";
    case "PJ":
      return "pj";
    case "BENEFICIARIO":
      return "beneficiario";
    default:
      return "interno";
  }
}

export function buildPortalPromptSection(user: {
  role: Role;
  labels: NicheLabels;
  tenantName: string;
  companyName?: string | null;
  patientName?: string | null;
  internoPermissions?: string[];
}): string[] {
  const l = user.labels;
  const lines: string[] = [];

  switch (user.role) {
    case "INTERNO":
      lines.push(
        `Conceito: assistente da **operação interna** (${user.tenantName}).`,
        `Foco: agenda, cadastros, faturamento, relatórios — conforme permissões: ${user.internoPermissions?.join(", ") ?? "—"}.`,
        `Pode preparar rascunhos (usuário, ${l.patient.toLowerCase()}, ${l.appointment.toLowerCase()}) que exigem confirmação humana.`,
        `Termos do tenant: ${l.patient}, ${l.provider}, ${l.appointment}, ${l.procedure}, ${l.beneficiary}.`,
      );
      break;
    case "PRESTADOR":
      lines.push(
        `Conceito: assistente do **${l.provider}** logado — só dados da própria agenda e carteira.`,
        `Foco: agenda do dia, ${l.patients.toLowerCase()} atendidos, extrato financeiro.`,
        `Não cria cadastros globais nem acessa dados de outros ${l.providers.toLowerCase()}.`,
      );
      break;
    case "PJ":
      lines.push(
        `Conceito: assistente da **empresa** ${user.companyName ?? "PJ"}.`,
        `Foco: ${l.beneficiaries.toLowerCase()} do contrato, assinaturas, faturas corporativas.`,
        `Escopo restrito à empresa vinculada — sem dados de outras PJ.`,
      );
      break;
    case "BENEFICIARIO":
      lines.push(
        `Conceito: assistente **self-service** de ${user.patientName ?? l.beneficiary.toLowerCase()}.`,
        `Foco: resumo da conta, ${l.appointments.toLowerCase()}, faturas, agendar ${l.appointment.toLowerCase()}.`,
        `Agendamento pelo chat exige confirmação. Só dados do próprio cadastro.`,
      );
      break;
  }

  return lines;
}

export function buildPortalHelpFallback(
  role: Role,
  labels: NicheLabels,
  toolNames: Set<string>,
  activeDraftTool?: string,
): string {
  if (activeDraftTool === "draft_create_appointment") {
    return [
      "Continuando o agendamento — me diga o que falta:",
      `• Nome do ${labels.patient.toLowerCase()} (ex.: *para João Pereira*)`,
      `• ${labels.procedure} (ex.: *eletrocardiograma*) — se for marcar por exame`,
      `• ${labels.provider} (ex.: *com Dra. Helena*) — ou *não sei* para ver a lista`,
      "• Data e hora (ex.: *amanhã às 15h*)",
    ].join("\n");
  }

  if (activeDraftTool === "draft_book_appointment") {
    return [
      `Continuando seu agendamento — informe:`,
      `• ${labels.procedure} desejado (opcional)`,
      `• Data e horário (ex.: *amanhã às 11h*)`,
      `• ${labels.provider} — ou diga *sem preferência* para ver horários de todos`,
    ].join("\n");
  }

  const examples: Record<Role, string[]> = {
    INTERNO: [
      `${labels.appointments} de hoje`,
      "Receita de ontem",
      "Quem está devendo?",
      `Como cadastrar ${labels.patient.toLowerCase()}?`,
    ],
    PRESTADOR: [
      `Minha agenda de hoje`,
      `Meus ${labels.patients.toLowerCase()}`,
      "Extrato do mês",
      "Próximo atendimento",
    ],
    PJ: [
      "Resumo da empresa",
      `${labels.beneficiaries} ativos`,
      "Faturas em aberto",
    ],
    BENEFICIARIO: [
      "Meu resumo",
      `Próximos ${labels.appointments.toLowerCase()}`,
      "Minhas faturas",
      `Quero agendar ${labels.appointment.toLowerCase()}`,
    ],
  };

  const portal = PORTALS[roleToPortalKey(role)];
  const hints = examples[role] ?? examples.INTERNO;
  const available = [...toolNames].slice(0, 8).join(", ");

  return [
    `Não entendi bem no **${portal.label}**. Tente algo como:`,
    ...hints.map((h) => `• ${h}`),
    "",
    `Operações disponíveis no seu perfil: ${available}.`,
  ].join("\n");
}

export function resolvePortalFollowUpTool(
  role: Role,
  text: string,
  lastTool: string | null,
): string | null {
  if (!lastTool) return null;
  const trimmed = text.trim();
  const dateOnly =
    /^(e\s+)?(ontem|hoje|amanha|amanhã)$/.test(trimmed) ||
    /^(e\s+)?(ontem|hoje|amanha)/.test(trimmed);
  if (dateOnly) return lastTool;

  const maps: Record<Role, [RegExp, string][]> = {
    INTERNO: [
      [/\b(receita|faturamento|financeiro)\b/, "get_revenue_summary"],
      [/\b(devedor|devendo|pendencia|pendência)\b/, "list_debtors"],
      [/\b(agenda|agendamento)\b/, "count_appointments"],
      [/\b(dashboard|resumo|kpi)\b/, "get_dashboard_kpis"],
      [/\b(prestador|medico|médico)\b/, "list_providers"],
      [/\b(procedimento|exame)\b/, "list_procedures"],
    ],
    PRESTADOR: [
      [/\b(agenda|agendamento|consulta|atendimento)\b/, "list_my_appointments"],
      [/\b(paciente|pet|cliente|aluno)\b/, "list_my_patients"],
      [/\b(extrato|ganho|recebi)\b/, "get_extrato_summary"],
      [/\b(dashboard|resumo)\b/, "get_prestador_dashboard"],
    ],
    PJ: [
      [/\b(resumo|empresa|contrato)\b/, "get_pj_overview"],
      [/\b(beneficiario|beneficiário|colaborador|tutor|aluno)\b/, "list_company_beneficiaries"],
      [/\b(fatura|boleto|aberto|pendente)\b/, "get_open_invoices"],
    ],
    BENEFICIARIO: [
      [/\b(resumo|conta)\b/, "get_my_overview"],
      [/\b(agenda|agendamento|consulta|marcar|agendar)\b/, "list_my_appointments"],
      [/\b(fatura|boleto|pix|pagar)\b/, "list_my_invoices"],
      [/\b(horario|horário|vaga|slot)\b/, "list_available_slots"],
    ],
  };

  for (const [re, tool] of maps[role] ?? maps.INTERNO) {
    if (re.test(text)) return tool;
  }

  return null;
}
