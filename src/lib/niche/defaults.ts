import { NICHE_MASTER_LABELS } from "@/constants/niches";
import type { NicheConfig, NicheId } from "@/lib/niche/types";
import { isNicheId } from "@/lib/niche/types";

export const NICHE_CONFIGS: Record<NicheId, NicheConfig> = {
  MEDICAL: {
    id: "MEDICAL",
    name: "Saúde",
    tagline: "Gestão inteligente em saúde para clínicas e operadoras",
    labels: NICHE_MASTER_LABELS.MEDICAL,
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
    labels: NICHE_MASTER_LABELS.VET,
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
    labels: NICHE_MASTER_LABELS.DENTAL,
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
    labels: NICHE_MASTER_LABELS.LEGAL,
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
    labels: NICHE_MASTER_LABELS.SPA,
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
    labels: NICHE_MASTER_LABELS.EDUCATION,
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

export function getDefaultLabels(niche: string) {
  return getNicheConfig(niche).labels;
}
