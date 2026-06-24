import type { BrandingTokens } from "@/lib/theme/tokens";

/** Converte branding em CSS custom properties para injecao runtime. */
export function brandingToCssVars(
  branding: BrandingTokens,
  extra?: Record<string, string>,
): Record<string, string> {
  return {
    "--brand-primary": branding.primaryColor,
    "--brand-accent": branding.accentColor,
    "--brand-hero-from": branding.heroFrom,
    "--brand-hero-to": branding.heroTo,
    /* Portal espelha whitelabel do tenant — nav, links e botões portal */
    "--portal-accent": branding.accentColor,
    "--portal-accent-from": branding.heroFrom,
    "--portal-accent-to": branding.heroTo,
    ...extra,
  };
}

/** Atributo data-theme para TenantTheme (light | dark | system). */
export function brandingThemeAttribute(branding: BrandingTokens): string {
  return branding.colorScheme ?? "light";
}
