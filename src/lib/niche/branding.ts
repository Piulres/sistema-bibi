import type { NicheId } from "@/lib/niche/types";
import { getNicheConfig } from "@/lib/niche/defaults";
import { NICHE_PRESETS_ENERGIA_BRASILEIRA } from "@/lib/theme/presets-energia-brasileira";
import type { BrandingTokens } from "@/lib/theme/tokens";

const DEFAULT_PLATFORM_COLORS = {
  primary: "#1e293b",
  accent: "#f97316",
  heroFrom: "#1e293b",
  heroTo: "#f59e0b",
} as const;

function matchesPlatformDefaults(branding: BrandingTokens): boolean {
  return (
    branding.primaryColor === DEFAULT_PLATFORM_COLORS.primary &&
    branding.accentColor === DEFAULT_PLATFORM_COLORS.accent &&
    branding.heroFrom === DEFAULT_PLATFORM_COLORS.heroFrom &&
    branding.heroTo === DEFAULT_PLATFORM_COLORS.heroTo
  );
}

/**
 * Aplica paleta do segmento somente quando não há whitelabel salvo no banco.
 * Registros `TenantBranding` são sempre fonte de verdade (inclui customizações).
 */
export function applyNicheBrandingDefaults(
  niche: string,
  branding: BrandingTokens,
  options?: { fromDatabase?: boolean },
): BrandingTokens {
  if (options?.fromDatabase) return branding;
  if (!matchesPlatformDefaults(branding)) return branding;

  const preset = NICHE_PRESETS_ENERGIA_BRASILEIRA[niche as NicheId];
  if (!preset) return branding;

  return {
    ...branding,
    primaryColor: preset.primaryColor,
    accentColor: preset.accentColor,
    heroFrom: preset.heroFrom,
    heroTo: preset.heroTo,
  };
}

export function nicheLandingBranding(niche: NicheId, base: BrandingTokens): BrandingTokens {
  const config = getNicheConfig(niche);
  return {
    ...base,
    tagline: config.tagline,
    primaryColor: config.branding.primaryColor,
    accentColor: config.branding.accentColor,
    heroFrom: config.branding.heroFrom,
    heroTo: config.branding.heroTo,
  };
}
