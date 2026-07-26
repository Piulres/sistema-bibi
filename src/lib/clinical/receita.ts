/**
 * Receita médica — tipos alinhados à Portaria SVS/MS 344/1998 e RDC Anvisa 1000/2025.
 *
 * COMUM: receita simples (medicamentos não sujeitos a controle especial).
 * CONTROLE_ESPECIAL: Receita de Controle Especial (duas vias; listas C1/C5 etc.).
 *
 * Notificações de Receita A/B (entorpecentes/psicotrópicos) e SNCR eletrônico
 * ficam fora do escopo desta POC — ver docs/produto/DOCUMENTOS_CLINICOS.md.
 */

export const PRESCRIPTION_KINDS = ["COMUM", "CONTROLE_ESPECIAL"] as const;
export type PrescriptionKind = (typeof PRESCRIPTION_KINDS)[number];

export function isPrescriptionKind(value: string): value is PrescriptionKind {
  return (PRESCRIPTION_KINDS as readonly string[]).includes(value);
}

export function prescriptionKindLabel(kind: string): string {
  switch (kind) {
    case "COMUM":
      return "Receita comum";
    case "CONTROLE_ESPECIAL":
      return "Receita de controle especial";
    default:
      return kind;
  }
}

export function prescriptionKindHint(kind: PrescriptionKind): string {
  switch (kind) {
    case "CONTROLE_ESPECIAL":
      return "Duas vias (1ª farmácia / 2ª paciente). Validade típica 30 dias. Listas C1, C5 e adendos — Portaria 344 / RDC 1000.";
    default:
      return "Medicamentos sem controle especial (receituário simples).";
  }
}

export type ReceitaTemplateContext = {
  patientName: string;
  appointmentDate?: string;
  kind: PrescriptionKind;
  providerName?: string;
  councilLabel?: string;
};

/** Template de texto PEP para receita comum ou de controle especial. */
export function buildReceitaPepTemplate(ctx: ReceitaTemplateContext): {
  title: string;
  content: string;
} {
  const kindLabel = prescriptionKindLabel(ctx.kind);
  const providerLine = [ctx.providerName, ctx.councilLabel].filter(Boolean).join(" — ");

  if (ctx.kind === "CONTROLE_ESPECIAL") {
    return {
      title: kindLabel,
      content: `RECEITA DE CONTROLE ESPECIAL
Paciente: ${ctx.patientName}
Data: ${ctx.appointmentDate ?? new Date().toLocaleDateString("pt-BR")}
${providerLine ? `Prescritor: ${providerLine}\n` : ""}
1ª via — Retenção da Farmácia ou Drogaria
2ª via — Orientação ao Paciente

Medicamento (nome, concentração, forma):
Quantidade (algarismos e por extenso):
Posologia:
Duração do tratamento:

Observações / advertências:

Validade: 30 dias a partir da emissão (listas C1/C5 — conferir Portaria 344).`,
    };
  }

  return {
    title: kindLabel,
    content: `RECEITA COMUM
Paciente: ${ctx.patientName}
Data: ${ctx.appointmentDate ?? new Date().toLocaleDateString("pt-BR")}
${providerLine ? `Prescritor: ${providerLine}\n` : ""}
Medicamento 1 — dose / frequência / via / duração:
Medicamento 2 — dose / frequência / via / duração:

Uso contínuo: [ ] Sim  [ ] Não
Observações:`,
  };
}
