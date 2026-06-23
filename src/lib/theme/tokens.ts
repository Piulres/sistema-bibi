import type { ColorScheme } from "@/lib/theme/color-scheme";

const SHARED_BRAND_COLORS = {
  logoUrl: null as string | null,
  primaryColor: "#0d9488",
  accentColor: "#14b8a6",
  heroFrom: "#0f172a",
  heroTo: "#134e4a",
  colorScheme: "light" as ColorScheme,
  customDomain: null,
  customDomainVerified: false,
} as const;

/** Cores e rótulos padrão para tenants sem branding customizado no banco. */
export const CLINIC_BRANDING_DEFAULTS = {
  ...SHARED_BRAND_COLORS,
  tagline: null as string | null,
  platformLabel: "ServiceOS v2.0 · Pay Per Use",
} as const;

/** Identidade comercial da plataforma (landing e marketing). */
export const PLATFORM_BRANDING: BrandingTokens = {
  displayName: "ServiceOS Bibi",
  tagline: "Infraestrutura Pay Per Use multi-nicho para serviços profissionais",
  ...SHARED_BRAND_COLORS,
  platformLabel: "ServiceOS · Pay Per Use Multi-Nicho",
};

/** Shell neutro dos logins públicos quando o tenant não é resolvido por domínio. */
export const LOGIN_PORTAL_BRANDING: BrandingTokens = {
  displayName: "Portal da clínica",
  tagline: null,
  ...SHARED_BRAND_COLORS,
  platformLabel: "ServiceOS v2.0 · demonstração",
};

/** @deprecated Prefer PLATFORM_BRANDING, CLINIC_BRANDING_DEFAULTS ou LOGIN_PORTAL_BRANDING. */
export const DEFAULT_BRANDING = CLINIC_BRANDING_DEFAULTS;

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
