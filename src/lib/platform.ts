/** Identidade da plataforma — fonte única para UI, exports e metadados. */
export const PLATFORM = {
  name: "ServiceOS Bibi",
  shortName: "ServiceOS",
  version: "2.0",
  versionLabel: "ServiceOS v2.0",
  tagline: "Infraestrutura Pay Per Use multi-nicho para serviços profissionais",
  description:
    "Plataforma ServiceOS com Pay Per Use, quatro portais integrados, white label por tenant e vocabulário adaptável por segmento (saúde, veterinária, odontologia, jurídico, bem-estar e educação).",
  applicationCategory: "BusinessApplication",
  poweredBy: "ServiceOS v2.0 · Pay Per Use",
  loginDisplayName: "Portal da operação",
} as const;

export const PLATFORM_SEGMENTS = [
  "MEDICAL",
  "VET",
  "DENTAL",
  "LEGAL",
  "SPA",
  "EDUCATION",
] as const;
