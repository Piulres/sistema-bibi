import type { NicheId } from "@/lib/niche/types";
import { getNicheConfig } from "@/lib/niche/defaults";
import { NICHE_PRESETS_ENERGIA_BRASILEIRA } from "@/lib/theme/presets-energia-brasileira";
import type { BrandingTokens } from "@/lib/theme/tokens";

const DEFAULT_PLATFORM_COLORS = {
  primary: "#1e293b",
  accent: "#f97316",
} as const;

function isDefaultPlatformBranding(branding: BrandingTokens): boolean {
  return (
    branding.primaryColor === DEFAULT_PLATFORM_COLORS.primary &&
    branding.accentColor === DEFAULT_PLATFORM_COLORS.accent
  );
}

/** Aplica paleta automática do nicho quando o tenant não customizou cores. */
export function applyNicheBrandingDefaults(
  niche: string,
  branding: BrandingTokens,
): BrandingTokens {
  if (!isDefaultPlatformBranding(branding)) return branding;

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
