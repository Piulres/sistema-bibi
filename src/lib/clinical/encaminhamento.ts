/**
 * Encaminhamento clínico — documento de saída do atendimento.
 *
 * Padrão de mercado (DocVox, Doctor's Office, Colmeia): emitir no consultório,
 * imprimir guia A4 e disponibilizar no painel do paciente.
 * Assinatura ICP-Brasil / QRCode ficam fora do escopo POC.
 */

export const REFERRAL_KINDS = ["ESPECIALIDADE", "RETORNO", "SERVICO"] as const;
export type ReferralKind = (typeof REFERRAL_KINDS)[number];

export const REFERRAL_URGENCIES = ["ROTINA", "BREVE", "URGENTE"] as const;
export type ReferralUrgency = (typeof REFERRAL_URGENCIES)[number];

export const REFERRAL_STATUSES = ["ATIVO", "CANCELADO"] as const;
export type ReferralStatus = (typeof REFERRAL_STATUSES)[number];

export function isReferralKind(value: string): value is ReferralKind {
  return (REFERRAL_KINDS as readonly string[]).includes(value);
}

export function isReferralUrgency(value: string): value is ReferralUrgency {
  return (REFERRAL_URGENCIES as readonly string[]).includes(value);
}

export function referralKindLabel(kind: string): string {
  switch (kind) {
    case "ESPECIALIDADE":
      return "Encaminhamento para especialidade";
    case "RETORNO":
      return "Encaminhamento de retorno";
    case "SERVICO":
      return "Encaminhamento para serviço";
    default:
      return kind;
  }
}

export function referralUrgencyLabel(urgency: string): string {
  switch (urgency) {
    case "ROTINA":
      return "Rotina";
    case "BREVE":
      return "Breve";
    case "URGENTE":
      return "Urgente";
    default:
      return urgency;
  }
}

export function referralStatusLabel(status: string): string {
  switch (status) {
    case "ATIVO":
      return "Ativo";
    case "CANCELADO":
      return "Cancelado";
    default:
      return status;
  }
}

/** Template reutilizável — acelera emissão (padrão de mercado). */
export type ReferralTemplate = {
  id: string;
  label: string;
  specialty: string;
  referralKind: ReferralKind;
  urgency: ReferralUrgency;
  clinicalReason: string;
  requestedActions: string;
};

export const REFERRAL_TEMPLATES: ReferralTemplate[] = [
  {
    id: "cardio",
    label: "Cardiologia",
    specialty: "Cardiologia",
    referralKind: "ESPECIALIDADE",
    urgency: "ROTINA",
    clinicalReason:
      "Avaliação cardiológica por quadro clínico e/ou fatores de risco cardiovascular.",
    requestedActions:
      "Avaliar necessidade de exames complementares e conduta terapêutica.",
  },
  {
    id: "orto",
    label: "Ortopedia",
    specialty: "Ortopedia",
    referralKind: "ESPECIALIDADE",
    urgency: "ROTINA",
    clinicalReason: "Dor/limitação musculoesquelética com indicação de avaliação especializada.",
    requestedActions: "Exame físico dirigido, imagem se pertinente e plano de reabilitação.",
  },
  {
    id: "gastro",
    label: "Gastroenterologia",
    specialty: "Gastroenterologia",
    referralKind: "ESPECIALIDADE",
    urgency: "ROTINA",
    clinicalReason: "Sintomas digestivos persistentes com indicação de avaliação especializada.",
    requestedActions: "Definir investigação (laboratorial/endoscópica) e tratamento.",
  },
  {
    id: "endocrino",
    label: "Endocrinologia",
    specialty: "Endocrinologia",
    referralKind: "ESPECIALIDADE",
    urgency: "ROTINA",
    clinicalReason: "Alterações metabólicas/endócrinas com necessidade de acompanhamento especializado.",
    requestedActions: "Revisar exames, ajustar terapêutica e metas de controle.",
  },
  {
    id: "dermato",
    label: "Dermatologia",
    specialty: "Dermatologia",
    referralKind: "ESPECIALIDADE",
    urgency: "ROTINA",
    clinicalReason: "Lesão ou quadro dermatológico com indicação de avaliação especializada.",
    requestedActions: "Diagnóstico diferencial e conduta (biópsia se indicada).",
  },
  {
    id: "psiquiatria",
    label: "Psiquiatria",
    specialty: "Psiquiatria",
    referralKind: "ESPECIALIDADE",
    urgency: "BREVE",
    clinicalReason: "Sintomas psíquicos com impacto funcional — indicação de avaliação especializada.",
    requestedActions: "Avaliação diagnóstica e plano terapêutico.",
  },
  {
    id: "retorno-especialista",
    label: "Retorno ao especialista",
    specialty: "Especialidade de origem",
    referralKind: "RETORNO",
    urgency: "ROTINA",
    clinicalReason: "Retorno para reavaliação após exames/conduta inicial.",
    requestedActions: "Revisar resultados, ajustar conduta e definir seguimento.",
  },
  {
    id: "fisio",
    label: "Fisioterapia",
    specialty: "Fisioterapia",
    referralKind: "SERVICO",
    urgency: "ROTINA",
    clinicalReason: "Indicação de reabilitação funcional.",
    requestedActions: "Avaliação fisioterapêutica e plano de sessões.",
  },
];

export type EncaminhamentoTemplateContext = {
  patientName: string;
  specialty: string;
  clinicalReason: string;
  urgency?: ReferralUrgency;
  historySummary?: string;
  requestedActions?: string;
  providerName?: string;
  councilLabel?: string;
  appointmentDate?: string;
};

/** Texto estruturado para guia impressa / histórico. */
export function buildEncaminhamentoDocument(ctx: EncaminhamentoTemplateContext): {
  title: string;
  content: string;
} {
  const urgency = ctx.urgency ?? "ROTINA";
  const providerLine = [ctx.providerName, ctx.councilLabel].filter(Boolean).join(" — ");

  const lines = [
    "ENCAMINHAMENTO CLÍNICO",
    `Paciente: ${ctx.patientName}`,
    `Data: ${ctx.appointmentDate ?? new Date().toLocaleDateString("pt-BR")}`,
    `Especialidade/serviço: ${ctx.specialty}`,
    `Urgência: ${referralUrgencyLabel(urgency)}`,
    "",
    "Motivo clínico:",
    ctx.clinicalReason.trim(),
  ];

  if (ctx.historySummary?.trim()) {
    lines.push("", "Histórico relevante:", ctx.historySummary.trim());
  }
  if (ctx.requestedActions?.trim()) {
    lines.push("", "Condutas / exames solicitados ao especialista:", ctx.requestedActions.trim());
  }
  if (providerLine) {
    lines.push("", `Médico solicitante: ${providerLine}`);
  }

  return {
    title: `Encaminhamento — ${ctx.specialty}`,
    content: lines.join("\n"),
  };
}
