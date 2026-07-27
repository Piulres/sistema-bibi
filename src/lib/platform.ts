/** Identidade da plataforma — fonte única para UI, exports e metadados. */
export const PLATFORM = {
  name: "Sistema Bibi - ServiceOS",
  /** Marca curta no header da landing (sem sufixo ServiceOS). */
  brandName: "Sistema Bibi",
  /** Texto dentro do círculo da marca na home da plataforma (não confundir com displayName). */
  brandMark: "Bibi",
  shortName: "ServiceOS",
  /** Major.minor — prefixo de `release` / package.json (docs:verify). */
  version: "3.0",
  /** Semver completo do pacote em produção (title, footer, badges). */
  release: "3.0.27",
  versionLabel: "Sistema Bibi - ServiceOS v3.0.27",
  tagline: "Pay Per Use multi-nicho — empresa, prestador e cliente na mesma operação",
  description:
    "Sistema Bibi - ServiceOS: infraestrutura horizontal Pay Per Use com quatro portais integrados. Conecte empresa, prestador e cliente final — cobre só pelo uso real, com white label e vocabulário por segmento.",
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
