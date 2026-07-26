/**
 * Atestado médico — estrutura alinhada à Resolução CFM nº 2.381/2024
 * e à plataforma Atesta CFM (Res. CFM nº 2.382/2024).
 *
 * POC: gera texto estruturado no PEP. Integração oficial Atesta CFM /
 * assinatura qualificada ficam fora do escopo (documentado em docs/produto).
 */

export const ATESTADO_KINDS = [
  "AFASTAMENTO",
  "ACOMPANHAMENTO",
  "COMPARECIMENTO",
] as const;

export type AtestadoKind = (typeof ATESTADO_KINDS)[number];

export type AtestadoFormInput = {
  kind: AtestadoKind;
  patientName: string;
  patientCpf?: string | null;
  days: number;
  startDateLabel: string;
  cid?: string | null;
  cidAuthorizedByPatient: boolean;
  providerName?: string | null;
  councilLabel?: string | null;
  notes?: string | null;
};

export function isAtestadoKind(value: string): value is AtestadoKind {
  return (ATESTADO_KINDS as readonly string[]).includes(value);
}

export function atestadoKindLabel(kind: AtestadoKind): string {
  switch (kind) {
    case "AFASTAMENTO":
      return "Atestado de afastamento";
    case "ACOMPANHAMENTO":
      return "Atestado de acompanhamento";
    case "COMPARECIMENTO":
      return "Declaração de comparecimento";
    default:
      return kind;
  }
}

export function validateAtestadoForm(
  input: Partial<AtestadoFormInput>,
): string | null {
  if (!input.kind || !isAtestadoKind(input.kind)) {
    return "Selecione o tipo de atestado";
  }
  if (!input.patientName?.trim()) {
    return "Informe o nome do paciente";
  }
  if (!input.days || input.days < 1 || !Number.isFinite(input.days)) {
    return "Informe a quantidade de dias (mínimo 1)";
  }
  if (!input.startDateLabel?.trim()) {
    return "Informe a data de início / comparecimento";
  }
  if (input.cid?.trim() && !input.cidAuthorizedByPatient) {
    return "CID só pode constar com autorização expressa do paciente (CFM 2.381/2024)";
  }
  return null;
}

/** Monta título + corpo do atestado para gravação no PEP. */
export function buildAtestadoDocument(input: AtestadoFormInput): {
  title: string;
  content: string;
} {
  const title = atestadoKindLabel(input.kind);
  const cpfLine = input.patientCpf?.trim()
    ? `CPF: ${input.patientCpf.trim()}`
    : "CPF: (não informado)";
  const providerLine = [
    input.providerName?.trim(),
    input.councilLabel?.trim(),
  ]
    .filter(Boolean)
    .join(" — ");

  const cidBlock =
    input.cid?.trim() && input.cidAuthorizedByPatient
      ? `\nCID (autorizado pelo paciente/representante): ${input.cid.trim()}`
      : "\nCID: não incluído (sem autorização do paciente).";

  let body: string;
  switch (input.kind) {
    case "ACOMPANHAMENTO":
      body = `Atesto para os devidos fins que ${input.patientName} acompanhou paciente em atendimento médico, necessitando afastar-se de suas atividades por ${input.days} dia(s), a partir de ${input.startDateLabel}.`;
      break;
    case "COMPARECIMENTO":
      body = `Declaro para os devidos fins que ${input.patientName} compareceu a atendimento médico em ${input.startDateLabel}${input.days > 1 ? `, com permanência estimada de ${input.days} dia(s)` : ""}.`;
      break;
    default:
      body = `Atesto para os devidos fins que ${input.patientName} necessita de afastamento de suas atividades por ${input.days} dia(s), a partir de ${input.startDateLabel}, para recuperação.`;
  }

  const notes = input.notes?.trim() ? `\n\nObservações: ${input.notes.trim()}` : "";
  const footer = `

Identificação do paciente: ${input.patientName}
${cpfLine}${cidBlock}
${providerLine ? `\nMédico(a): ${providerLine}` : ""}
Data de emissão: ${new Date().toLocaleDateString("pt-BR")}

— Documento gerado no ServiceOS (POC). Em produção nacional, atestados devem ser emitidos via Atesta CFM ou sistema integrado (Res. CFM 2.382/2024).`;

  return {
    title,
    content: `${body}${notes}${footer}`,
  };
}
