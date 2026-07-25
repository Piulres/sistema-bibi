/** Identidade da plataforma — fonte única para UI, exports e metadados. */
export const PLATFORM = {
  name: "Sistema Bibi - ServiceOS",
  shortName: "ServiceOS",
  /** Major.minor — prefixo de `release` / package.json (docs:verify). */
  version: "2.6",
  /** Semver completo do pacote em produção (title, footer, badges). */
  release: "2.6.0",
  versionLabel: "Sistema Bibi - ServiceOS v2.6.0",
  tagline: "Infraestrutura Pay Per Use multi-nicho para serviços profissionais",
  description:
    "Sistema Bibi - ServiceOS: plataforma Pay Per Use com quatro portais integrados, white label por tenant e vocabulário adaptável por segmento (saúde, veterinária, odontologia, jurídico, bem-estar, educação e engenharia).",
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
