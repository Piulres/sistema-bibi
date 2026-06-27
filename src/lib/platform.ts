/** Identidade da plataforma — fonte única para UI, exports e metadados. */
export const PLATFORM = {
  name: "Sistema Bibi - ServiceOS",
  shortName: "ServiceOS",
  version: "2.3",
  versionLabel: "Sistema Bibi - ServiceOS v2.3",
  tagline: "Infraestrutura Pay Per Use multi-nicho para serviços profissionais",
  description:
    "Sistema Bibi - ServiceOS: plataforma Pay Per Use com quatro portais integrados, white label por tenant e vocabulário adaptável por segmento (saúde, veterinária, odontologia, jurídico, bem-estar e educação).",
  applicationCategory: "BusinessApplication",
  poweredBy: "Sistema Bibi - ServiceOS · Pay Per Use",
  loginDisplayName: "Portal da operação",
} as const;

export const PLATFORM_SEGMENTS = [
  "MEDICAL",
  "VET",
  "DENTAL",
  "LEGAL",
  "SPA",
  "EDUCATION",
  "CONSTRUCTION",
] as const;
