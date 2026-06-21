export const PEP_RECORD_TYPES = [
  { value: "EVOLUCAO", label: "Evolução clínica" },
  { value: "ANAMNESE", label: "Anamnese" },
  { value: "RECEITA", label: "Receita médica" },
  { value: "ATESTADO", label: "Atestado" },
] as const;

export type PepRecordType = (typeof PEP_RECORD_TYPES)[number]["value"];

const TYPE_SET = new Set<string>(PEP_RECORD_TYPES.map((t) => t.value));

export function isPepRecordType(value: string): value is PepRecordType {
  return TYPE_SET.has(value);
}

export function pepRecordTypeLabel(value: string): string {
  return PEP_RECORD_TYPES.find((t) => t.value === value)?.label ?? value;
}

type TemplateContext = {
  patientName: string;
  providerName?: string;
  appointmentDate?: string;
};

/** Templates estruturados de PEP por tipo de registro. */
export function buildPepTemplate(
  recordType: PepRecordType,
  ctx: TemplateContext,
): { title: string; content: string } {
  switch (recordType) {
    case "ANAMNESE":
      return {
        title: "Anamnese",
        content: `Paciente: ${ctx.patientName}
Queixa principal:
História da doença atual:
Antecedentes pessoais:
Medicações em uso:
Alergias:
Exame físico:`,
      };
    case "RECEITA":
      return {
        title: "Receita médica",
        content: `Paciente: ${ctx.patientName}
Data: ${ctx.appointmentDate ?? new Date().toLocaleDateString("pt-BR")}

Medicamento 1 — posologia:
Medicamento 2 — posologia:

Observações:`,
      };
    case "ATESTADO":
      return {
        title: "Atestado médico",
        content: `Atesto para os devidos fins que ${ctx.patientName} necessita de afastamento de suas atividades por ___ dia(s), a partir de ${ctx.appointmentDate ?? new Date().toLocaleDateString("pt-BR")}.

CID (opcional):`,
      };
    default:
      return {
        title: "Evolução clínica",
        content: `Paciente: ${ctx.patientName}
${ctx.providerName ? `Profissional: ${ctx.providerName}\n` : ""}
Subjetivo (S):
Objetivo (O):
Avaliação (A):
Plano (P):`,
      };
  }
}
