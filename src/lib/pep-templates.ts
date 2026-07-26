import {
  buildReceitaPepTemplate,
  type PrescriptionKind,
} from "@/lib/clinical/receita";
import {
  buildAtestadoDocument,
  type AtestadoKind,
} from "@/lib/clinical/atestado";

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
  councilLabel?: string;
  patientCpf?: string | null;
  /** Tipo de receita quando recordType === RECEITA */
  prescriptionKind?: PrescriptionKind;
  /** Tipo de atestado quando recordType === ATESTADO */
  atestadoKind?: AtestadoKind;
  atestadoDays?: number;
  cid?: string | null;
  cidAuthorizedByPatient?: boolean;
  notes?: string | null;
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
        content: `${ctx.patientName}
Queixa principal:
História da doença atual:
Antecedentes pessoais:
Medicações em uso:
Alergias:
Exame físico:`,
      };
    case "RECEITA": {
      const kind = ctx.prescriptionKind ?? "COMUM";
      return buildReceitaPepTemplate({
        patientName: ctx.patientName,
        appointmentDate: ctx.appointmentDate,
        kind,
        providerName: ctx.providerName,
        councilLabel: ctx.councilLabel,
      });
    }
    case "ATESTADO":
      return buildAtestadoDocument({
        kind: ctx.atestadoKind ?? "AFASTAMENTO",
        patientName: ctx.patientName,
        patientCpf: ctx.patientCpf,
        days: ctx.atestadoDays && ctx.atestadoDays > 0 ? ctx.atestadoDays : 1,
        startDateLabel:
          ctx.appointmentDate ?? new Date().toLocaleDateString("pt-BR"),
        cid: ctx.cid,
        cidAuthorizedByPatient: Boolean(ctx.cidAuthorizedByPatient),
        providerName: ctx.providerName,
        councilLabel: ctx.councilLabel,
        notes: ctx.notes,
      });
    default:
      return {
        title: "Evolução clínica",
        content: `${ctx.patientName}
${ctx.providerName ? `Profissional: ${ctx.providerName}\n` : ""}
Subjetivo (S):
Objetivo (O):
Avaliação (A):
Plano (P):`,
      };
  }
}
