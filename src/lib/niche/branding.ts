import type { NicheId } from "@/lib/niche/types";
import { getNicheConfig } from "@/lib/niche/defaults";
import type { BrandingTokens } from "@/lib/theme/tokens";

/** Aplica paleta automática do nicho quando o tenant não customizou cores. */
export function applyNicheBrandingDefaults(
  niche: string,
  branding: BrandingTokens,
): BrandingTokens {
  const config = getNicheConfig(niche);
  const isDefaultTeal =
    branding.primaryColor === "#0d9488" && branding.accentColor === "#14b8a6";

  if (!isDefaultTeal) return branding;

  return {
    ...branding,
    primaryColor: config.branding.primaryColor,
    accentColor: config.branding.accentColor,
    heroFrom: config.branding.heroFrom,
    heroTo: config.branding.heroTo,
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
