import type { Role } from "@/lib/roles";
import type { NicheLabels } from "@/lib/niche/types";
import type { EntityOption } from "@/lib/assistant/resolve-entities";

/** Frases que indicam tom robótico — usadas em testes para garantir humanização. */
export const ROBOTIC_PHRASES = [
  "Informe o",
  "Até agora tenho:",
  "Até agora:",
  "Revise os dados abaixo",
  "Não entendi bem no",
  "Não identifiquei sua escolha",
  "Nenhum resultado.",
  "Erro ao executar a consulta.",
] as const;

export function partialSummaryIntro(): string {
  return "Até aqui, anotei:";
}

export function formatPartialBlock(partial: Record<string, string>, intro?: string): string {
  if (Object.keys(partial).length === 0) return "";
  const header = intro ?? partialSummaryIntro();
  const lines = Object.entries(partial).map(([k, v]) => `• ${k}: ${v}`);
  return `\n\n${header}\n${lines.join("\n")}`;
}

export function confirmPrompt(): string {
  return "Tudo certo? Confira os dados e **confirme** quando estiver pronto.";
}

export function runnerFallback(): string {
  return "Desculpe, não entendi. Pode reformular com outras palavras?";
}

export function runnerEmptyResult(): string {
  return "Não consegui obter os dados agora. Tente de novo em instantes.";
}

export function runnerUnavailable(): string {
  return "O assistente ainda não está disponível para o seu perfil.";
}

export function toolExecutionError(): string {
  return "Tive um problema ao consultar isso. Pode tentar de novo?";
}

export function permissionDenied(message?: string): string {
  return message ?? "Essa ação não está liberada para o seu perfil.";
}

export function greetingHelp(): string {
  return "Como posso ajudar? Use os atalhos abaixo ou descreva o que precisa.";
}

export function draftStuckHint(labels: NicheLabels, tool: string): string {
  if (tool === "draft_create_appointment" || tool === "draft_book_appointment") {
    return [
      `Ainda estou montando o ${labels.appointment.toLowerCase()}.`,
      `Me passe o que falta em uma frase — por exemplo: *${labels.patient} João, amanhã às 15h com Dra Helena*.`,
      `Ou diga *cancelar* para recomeçar.`,
    ].join("\n");
  }
  if (tool === "draft_create_patient") {
    return "Para cadastrar, envie nome, CPF e data de nascimento em uma mensagem.";
  }
  if (tool === "draft_create_user") {
    return "Para criar o usuário, informe nome, e-mail, senha e perfil (prestador, interno, PJ ou beneficiário).";
  }
  return "Não captei essa parte. Pode reformular com mais detalhes?";
}

export function portalFallbackIntro(portalLabel: string): string {
  return `Ainda não captei o que você precisa no **${portalLabel}**. Algumas ideias:`;
}

export function choiceNotRecognized(fieldLabel: string, options: EntityOption[]): string {
  const lines = [
    `Não consegui reconhecer essa opção de **${fieldLabel}**.`,
    "",
    ...options.map((option, index) => {
      const detail = option.detail ? ` — ${option.detail}` : "";
      return `**${index + 1}.** ${option.label}${detail}`;
    }),
    "",
    "Responda com o **número** ou o **nome completo** da opção.",
  ];
  return lines.join("\n");
}

export function formatChoiceQuestion(fieldLabel: string, options: EntityOption[]): string {
  const count = options.length;
  const lines = [
    `Encontrei **${count}** ${count === 1 ? "opção" : "opções"} de ${fieldLabel}. Qual é a certa?`,
    "",
    ...options.map((option, index) => {
      const detail = option.detail ? ` — ${option.detail}` : "";
      return `**${index + 1}.** ${option.label}${detail}`;
    }),
    "",
    "Responda com o **número** ou o **nome completo** da opção.",
  ];
  return lines.join("\n");
}

export function emptySearchResult(labels: NicheLabels): string {
  return `Não encontrei nenhum ${labels.patient.toLowerCase()} com esse filtro. Tente outro nome ou CPF.`;
}

export function emptyListResult(entityLabel: string): string {
  return `Não encontrei nenhum registro de ${entityLabel.toLowerCase()} por aqui.`;
}

export function emptyInvoices(): string {
  return "Você não tem faturas no momento — tudo em dia por aqui.";
}

export function emptyOpenInvoices(): string {
  return "Ótima notícia: não há faturas em aberto.";
}

export function emptySlots(date: string): string {
  return `Não há horários livres em **${date}**. Quer tentar outro dia?`;
}

export function draftFieldPrompt(
  field: string,
  labels: NicheLabels,
  tool?: string,
  niche?: import("@/lib/niche/types").NicheId,
): string {
  const needsPet = niche === "VET";
  const prompts: Record<string, string> = {
    patientName: needsPet
      ? `Para qual ${labels.beneficiary.toLowerCase()}? Me diga o nome do responsável.`
      : `Para quem será a ${labels.appointment.toLowerCase()}? Me diga o nome do ${labels.patient.toLowerCase()}.`,
    tutorName: `Para qual ${labels.beneficiary.toLowerCase()}? Me diga o nome do responsável.`,
    petName: `Qual o nome do ${labels.patient.toLowerCase()}? Ex.: *Thor*, *Luna*.`,
    providerName: `Com qual ${labels.provider.toLowerCase()}? Se não souber, diga *não sei* ou *listar prestadores*.`,
    providerPick: `Escolha o ${labels.provider.toLowerCase()} na lista ou me diga o nome.`,
    procedureName: `Qual ${labels.procedure.toLowerCase()}? Ex.: *eletrocardiograma*, *consulta clínica*.`,
    date: "Para qual data? Ex.: *amanhã*, *25/06/2026*.",
    time: "Qual horário combina melhor? Ex.: *15:30* ou *às 15h*.",
    name: "Qual o nome completo?",
    email: "Qual o e-mail de login?",
    password: "Qual a senha inicial? (pode usar *senha bibi123* no demo)",
    role: "Qual o perfil? *prestador*, *interno*, *pj* ou *beneficiário*.",
    cpf: "Qual o CPF?",
    birthDate: "Qual a data de nascimento? Ex.: *15/03/1990*.",
  };
  const base = prompts[field] ?? "Pode me contar um pouco mais?";
  if (
    (tool === "draft_create_appointment" || tool === "draft_book_appointment") &&
    field === "patientName"
  ) {
    return base;
  }
  return base;
}

export function draftMoreDetail(): string {
  return "Pode me contar um pouco mais?";
}

export function draftRemainingFields(rest: string[]): string {
  if (rest.length === 0) return "";
  return `\n\nDepois ainda vou precisar de: ${rest.join(" · ")}`;
}

export function appointmentDraftTip(labels: NicheLabels, niche?: import("@/lib/niche/types").NicheId): string {
  if (niche === "VET") {
    return `\n_Dica: *Marcar banho para o pet Thor do tutor João amanhã às 11h com Dr. Rafael*._`;
  }
  return `\n_Dica: dá para mandar tudo de uma vez — ex.: *Agendar ${labels.procedure.toLowerCase()} para João amanhã às 11h*._`;
}

export function resolvePatientHint(labels: NicheLabels, patientName?: string): string {
  const name = patientName ?? "...";
  return `\n\nConfira o nome ou tente: *buscar ${labels.patient.toLowerCase()} ${name}*.`;
}

export function resolveProviderHint(labels: NicheLabels): string {
  return `\n\nMe diga o ${labels.provider.toLowerCase()}, ex.: *com Dra. Helena*, ou diga *não sei* para ver a lista.`;
}

export function resolveProcedureHint(labels: NicheLabels): string {
  return `\n\nQual ${labels.procedure.toLowerCase()} você precisa? Ex.: *eletrocardiograma*.`;
}

export function buildResolveErrorGuidance(
  error: string,
  partial: Record<string, string>,
  labels: NicheLabels,
): string {
  const block = formatPartialBlock(partial, "Já tenho assim:");
  if (error.includes(labels.patient) || error.includes("Paciente")) {
    return `${error}${block}${resolvePatientHint(labels)}`;
  }
  if (error.includes(labels.provider) || error.includes("Prestador")) {
    return `${error}${block}${resolveProviderHint(labels)}`;
  }
  if (error.includes(labels.procedure) || error.includes("Procedimento")) {
    return `${error}${block}${resolveProcedureHint(labels)}`;
  }
  return `${error}${block}`;
}

export function buildDraftGuidanceText(input: {
  tool: string;
  missing: string[];
  labels: NicheLabels;
  partial: Record<string, string>;
  niche?: import("@/lib/niche/types").NicheId;
}): string {
  const { tool, missing, labels, partial, niche } = input;
  const lines: string[] = [];

  if (Object.keys(partial).length > 0) {
    lines.push(partialSummaryIntro());
    for (const [key, value] of Object.entries(partial)) {
      lines.push(`• ${key}: ${value}`);
    }
    lines.push("");
  }

  const next = missing[0];
  lines.push(next ? draftFieldPrompt(next, labels, tool, niche) : draftMoreDetail());

  if (missing.length > 1) {
    const rest = missing
      .slice(1)
      .map((m) => draftFieldPrompt(m, labels, tool, niche))
      .join(" · ");
    lines.push(draftRemainingFields([rest]));
  }

  if (tool === "draft_create_appointment" || tool === "draft_book_appointment") {
    lines.push(appointmentDraftTip(labels, niche));
  }

  return lines.join("\n");
}

export function draftContinuationIntro(labels: NicheLabels): string {
  return [
    "Continuando o agendamento — me diga o que falta:",
    `• Nome do ${labels.patient.toLowerCase()} (ex.: *para João Pereira*)`,
    `• ${labels.procedure} (ex.: *eletrocardiograma*) — se for marcar por exame`,
    `• ${labels.provider} (ex.: *com Dra. Helena*) — ou *não sei* para ver a lista`,
    "• Data e hora (ex.: *amanhã às 15h*)",
  ].join("\n");
}

export function bookContinuationIntro(labels: NicheLabels): string {
  return [
    "Vamos seguir com o seu agendamento:",
    `• ${labels.procedure} desejado (opcional)`,
    `• Data e horário (ex.: *amanhã às 11h*)`,
    `• ${labels.provider} — ou diga *sem preferência* para ver horários de todos`,
  ].join("\n");
}

export function formatKnowledgeAnswer(query: string, chunks: { title: string; source: string; content: string }[]): string {
  if (chunks.length === 0) {
    return `Não achei nada na documentação sobre "${query}". Tente outra pergunta ou use o menu do portal.`;
  }

  const lines = [`Achei **${chunks.length}** trecho(s) que podem ajudar com "${query}":`, ""];
  for (const chunk of chunks) {
    lines.push(`**${chunk.title}** (${chunk.source})`);
    lines.push(chunk.content.split("\n").slice(0, 6).join("\n"));
    lines.push("");
  }
  return lines.join("\n").trim();
}

export function confirmSuccessUser(name: string, email: string): string {
  return `Pronto! Usuário **${name}** criado com o e-mail ${email}.`;
}

export function confirmSuccessPatient(labels: NicheLabels, name: string): string {
  return `Cadastro feito! ${labels.patient} **${name}** já está no sistema.`;
}

export function confirmSuccessAppointment(labels: NicheLabels, scheduledAtLabel: string): string {
  return `${labels.appointment} confirmado(a) para **${scheduledAtLabel}**. Até lá!`;
}

export function confirmErrorPassword(): string {
  return "Preciso da senha para concluir o cadastro.";
}

export function confirmErrorNoPatient(): string {
  return "Sua conta não está vinculada a um cadastro de beneficiário.";
}

export function confirmErrorSelfOnly(): string {
  return "Pelo chat você só pode agendar para a sua própria conta.";
}

export function confirmErrorUnknown(): string {
  return "Não reconheci essa ação. Tente começar de novo.";
}

export function portalExamples(role: Role, labels: NicheLabels): string[] {
  const examples: Record<Role, string[]> = {
    INTERNO: [
      `${labels.appointments} de hoje`,
      "Receita de ontem",
      "Quem está devendo?",
      `Como cadastrar ${labels.patient.toLowerCase()}?`,
    ],
    PRESTADOR: [
      "Minha agenda de hoje",
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
  return examples[role] ?? examples.INTERNO;
}

export function isHumanized(text: string): boolean {
  return !ROBOTIC_PHRASES.some((phrase) => text.includes(phrase));
}
