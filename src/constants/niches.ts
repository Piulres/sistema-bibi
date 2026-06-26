/**
 * Dicionário mestre de nichos — fonte canônica dos termos padrão (ServiceOS v2.0).
 * Todo nicho novo DEVE definir todas as chaves de `NicheLabelKey` aqui.
 * O TypeScript falha em compile-time se alguma chave faltar (`satisfies`).
 */
import type { NicheId, NicheLabelKey, NicheLabels } from "@/lib/niche/types";
import { NICHE_IDS } from "@/lib/niche/types";

/** Todas as chaves obrigatórias do glossário — use ao criar telas ou seeds. */
export const NICHE_LABEL_KEYS = [
  "patient",
  "patients",
  "provider",
  "providers",
  "procedure",
  "procedures",
  "appointment",
  "appointments",
  "medicalRecord",
  "beneficiary",
  "beneficiaries",
  "company",
  "portalBeneficiary",
  "portalProvider",
  "service",
] as const satisfies readonly NicheLabelKey[];

const MEDICAL: NicheLabels = {
  patient: "Paciente",
  patients: "Pacientes",
  provider: "Prestador",
  providers: "Prestadores",
  procedure: "Procedimento",
  procedures: "Procedimentos",
  appointment: "Consulta",
  appointments: "Consultas",
  medicalRecord: "Prontuário",
  beneficiary: "Beneficiário",
  beneficiaries: "Beneficiários",
  company: "Empresa",
  portalBeneficiary: "Portal do Beneficiário",
  portalProvider: "Portal do Prestador",
  service: "Serviço de saúde",
};

const VET: NicheLabels = {
  patient: "Pet",
  patients: "Pets",
  provider: "Veterinário",
  providers: "Veterinários",
  procedure: "Serviço",
  procedures: "Serviços",
  appointment: "Atendimento",
  appointments: "Atendimentos",
  medicalRecord: "Ficha clínica",
  beneficiary: "Tutor",
  beneficiaries: "Tutores",
  company: "Parceiro",
  portalBeneficiary: "Portal do Tutor",
  portalProvider: "Portal do Veterinário",
  service: "Serviço veterinário",
};

const DENTAL: NicheLabels = {
  ...MEDICAL,
  appointment: "Consulta odontológica",
  appointments: "Consultas odontológicas",
  procedure: "Procedimento odontológico",
  procedures: "Procedimentos odontológicos",
  service: "Serviço odontológico",
};

const LEGAL: NicheLabels = {
  patient: "Cliente",
  patients: "Clientes",
  provider: "Advogado",
  providers: "Advogados",
  procedure: "Serviço jurídico",
  procedures: "Serviços jurídicos",
  appointment: "Atendimento",
  appointments: "Atendimentos",
  medicalRecord: "Dossiê",
  beneficiary: "Cliente",
  beneficiaries: "Clientes",
  company: "Escritório parceiro",
  portalBeneficiary: "Portal do Cliente",
  portalProvider: "Portal do Advogado",
  service: "Hora técnica jurídica",
};

const SPA: NicheLabels = {
  patient: "Cliente",
  patients: "Clientes",
  provider: "Profissional",
  providers: "Profissionais",
  procedure: "Sessão",
  procedures: "Sessões",
  appointment: "Agendamento",
  appointments: "Agendamentos",
  medicalRecord: "Ficha de atendimento",
  beneficiary: "Cliente",
  beneficiaries: "Clientes",
  company: "Parceiro corporativo",
  portalBeneficiary: "Portal do Cliente",
  portalProvider: "Portal do Profissional",
  service: "Serviço de bem-estar",
};

const EDUCATION: NicheLabels = {
  patient: "Aluno",
  patients: "Alunos",
  provider: "Instrutor",
  providers: "Instrutores",
  procedure: "Aula",
  procedures: "Aulas",
  appointment: "Aula",
  appointments: "Aulas",
  medicalRecord: "Histórico pedagógico",
  beneficiary: "Aluno",
  beneficiaries: "Alunos",
  company: "Instituição",
  portalBeneficiary: "Portal do Aluno",
  portalProvider: "Portal do Instrutor",
  service: "Serviço educacional",
};

const CONSTRUCTION: NicheLabels = {
  patient: "Obra",
  patients: "Obras",
  provider: "Engenheiro",
  providers: "Engenheiros",
  procedure: "Serviço técnico",
  procedures: "Serviços técnicos",
  appointment: "Vistoria",
  appointments: "Vistorias",
  medicalRecord: "Dossiê técnico",
  beneficiary: "Cliente",
  beneficiaries: "Clientes",
  company: "Incorporadora parceira",
  portalBeneficiary: "Portal do Cliente",
  portalProvider: "Portal do Engenheiro",
  service: "Hora técnica de engenharia",
};

/** Mapa mestre: nicho → glossário completo. Não editar em runtime. */
export const NICHE_MASTER_LABELS = {
  MEDICAL,
  VET,
  DENTAL,
  LEGAL,
  SPA,
  EDUCATION,
  CONSTRUCTION,
} as const satisfies Record<NicheId, NicheLabels>;

/** Resumo legível para AGENTS.md e documentação. */
export const NICHE_GLOSSARY_SUMMARY: Record<
  NicheId,
  Pick<NicheLabels, "patient" | "provider" | "procedure" | "appointment" | "beneficiary">
> = Object.fromEntries(
  NICHE_IDS.map((id) => [
    id,
    {
      patient: NICHE_MASTER_LABELS[id].patient,
      provider: NICHE_MASTER_LABELS[id].provider,
      procedure: NICHE_MASTER_LABELS[id].procedure,
      appointment: NICHE_MASTER_LABELS[id].appointment,
      beneficiary: NICHE_MASTER_LABELS[id].beneficiary,
    },
  ]),
) as Record<NicheId, Pick<NicheLabels, "patient" | "provider" | "procedure" | "appointment" | "beneficiary">>;

/** Defaults do nicho + overrides do tenant (JSON parcial). */
export function resolveNicheLabels(
  niche: string,
  overrides?: Partial<NicheLabels> | null,
): NicheLabels {
  const base =
    niche in NICHE_MASTER_LABELS
      ? NICHE_MASTER_LABELS[niche as NicheId]
      : NICHE_MASTER_LABELS.MEDICAL;
  return overrides ? { ...base, ...overrides } : { ...base };
}

/** Serializa labels para `Tenant.labels` no Prisma. */
export function serializeTenantLabels(
  niche: NicheId,
  overrides?: Partial<NicheLabels>,
): string {
  return JSON.stringify(resolveNicheLabels(niche, overrides));
}
