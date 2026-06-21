import type { ColorScheme } from "@/lib/theme/color-scheme";

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
  colorScheme: "light" as ColorScheme,
  customDomain: null,
  customDomainVerified: false,
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
  colorScheme: ColorScheme;
  customDomain: string | null;
  customDomainVerified: boolean;
};
