import type { NicheConfig, NicheId, NicheLabels } from "@/lib/niche/types";
import { isNicheId } from "@/lib/niche/types";

const MEDICAL_LABELS: NicheLabels = {
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

const VET_LABELS: NicheLabels = {
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

const DENTAL_LABELS: NicheLabels = {
  ...MEDICAL_LABELS,
  appointment: "Consulta odontológica",
  appointments: "Consultas odontológicas",
  procedure: "Procedimento odontológico",
  procedures: "Procedimentos odontológicos",
  service: "Serviço odontológico",
};

const LEGAL_LABELS: NicheLabels = {
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

const SPA_LABELS: NicheLabels = {
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

const EDUCATION_LABELS: NicheLabels = {
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

export const NICHE_CONFIGS: Record<NicheId, NicheConfig> = {
  MEDICAL: {
    id: "MEDICAL",
    name: "Saúde",
    tagline: "Gestão inteligente em saúde para clínicas e operadoras",
    labels: MEDICAL_LABELS,
    branding: {
      primaryColor: "#2563eb",
      accentColor: "#3b82f6",
      heroFrom: "#1e3a8a",
      heroTo: "#1d4ed8",
    },
    landing: {
      badge: "Saúde · SaaS · Pay Per Use",
      headline: "Gestão em saúde",
      headlineAccent: "sem burocracia",
      description:
        "Plataforma SaaS que clínicas e operadoras usam para Pay Per Use, quatro portais integrados e faturamento previsível.",
      keywords: ["healthtech", "saas saúde", "pay per use", "clínica", "prontuário eletrônico"],
    },
  },
  VET: {
    id: "VET",
    name: "Veterinária",
    tagline: "Gestão completa para clínicas e pet shops",
    labels: VET_LABELS,
    branding: {
      primaryColor: "#059669",
      accentColor: "#34d399",
      heroFrom: "#064e3b",
      heroTo: "#047857",
    },
    landing: {
      badge: "Veterinária · SaaS · Pay Per Use",
      headline: "Cuidado pet",
      headlineAccent: "com gestão inteligente",
      description:
        "Agenda, ficha clínica e faturamento Pay Per Use para clínicas veterinárias e pet shops — do banho e tosa à consulta especializada.",
      keywords: ["veterinária", "pet shop", "pay per use", "clínica veterinária", "gestão pet"],
    },
  },
  DENTAL: {
    id: "DENTAL",
    name: "Odontologia",
    tagline: "Operação odontológica com Pay Per Use nativo",
    labels: DENTAL_LABELS,
    branding: {
      primaryColor: "#0891b2",
      accentColor: "#22d3ee",
      heroFrom: "#164e63",
      heroTo: "#0e7490",
    },
    landing: {
      badge: "Odontologia · SaaS · Pay Per Use",
      headline: "Clínica odontológica",
      headlineAccent: "sem perda de receita",
      description:
        "Consultas, procedimentos e faturamento transparente para consultórios e redes odontológicas corporativas.",
      keywords: ["odontologia", "clínica dental", "pay per use", "consultório odontológico"],
    },
  },
  LEGAL: {
    id: "LEGAL",
    name: "Jurídico",
    tagline: "Infraestrutura Pay Per Use para escritórios de advocacia",
    labels: LEGAL_LABELS,
    branding: {
      primaryColor: "#475569",
      accentColor: "#94a3b8",
      heroFrom: "#0f172a",
      heroTo: "#334155",
    },
    landing: {
      badge: "Jurídico · SaaS · Pay Per Use",
      headline: "Escritório de advocacia",
      headlineAccent: "com cobrança por uso real",
      description:
        "Hora técnica, pareceres e atendimentos com preço congelado no registro — do escritório boutique ao B2B corporativo.",
      keywords: ["jurídico", "advocacia", "pay per use", "escritório de advocacia", "hora técnica"],
    },
  },
  SPA: {
    id: "SPA",
    name: "Bem-estar",
    tagline: "Spas e estúdios com faturamento previsível",
    labels: SPA_LABELS,
    branding: {
      primaryColor: "#a78bfa",
      accentColor: "#c4b5fd",
      heroFrom: "#4c1d95",
      heroTo: "#7c3aed",
    },
    landing: {
      badge: "Bem-estar · SaaS · Pay Per Use",
      headline: "Spa e bem-estar",
      headlineAccent: "com gestão unificada",
      description:
        "Massagens, yoga e sessões corporativas com agendamento, consumo Pay Per Use e portais para clientes e profissionais.",
      keywords: ["spa", "bem-estar", "yoga", "pay per use", "estúdio wellness"],
    },
  },
  EDUCATION: {
    id: "EDUCATION",
    name: "Educação",
    tagline: "Aulas e cursos com cobrança por sessão efetiva",
    labels: EDUCATION_LABELS,
    branding: {
      primaryColor: "#d97706",
      accentColor: "#fbbf24",
      heroFrom: "#78350f",
      heroTo: "#b45309",
    },
    landing: {
      badge: "Educação · SaaS · Pay Per Use",
      headline: "Educação e cursos",
      headlineAccent: "pague pelo que foi ministrado",
      description:
        "Aulas presenciais e online com snapshot de preço por sessão — escolas, estúdios e programas corporativos de capacitação.",
      keywords: ["educação", "cursos", "pay per use", "aulas", "capacitação corporativa"],
    },
  },
};

export function getNicheConfig(niche: string): NicheConfig {
  return isNicheId(niche) ? NICHE_CONFIGS[niche] : NICHE_CONFIGS.MEDICAL;
}

export function getDefaultLabels(niche: string): NicheLabels {
  return getNicheConfig(niche).labels;
}
