/** Tokens padrao da plataforma Bibi (fallback quando tenant nao tem branding). */
export const DEFAULT_BRANDING = {
  displayName: "Sistema Bibi",
  tagline: "Gestão inteligente em saúde",
  logoUrl: null as string | null,
  primaryColor: "#0d9488",
  accentColor: "#14b8a6",
  heroFrom: "#0f172a",
  heroTo: "#134e4a",
  platformLabel: "Sistema Bibi",
} as const;

export type BrandingTokens = {
  displayName: string;
  tagline: string | null;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  heroFrom: string;
  heroTo: string;
  platformLabel: string;
};
