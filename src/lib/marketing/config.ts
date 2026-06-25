/** Feature flags e IDs de tags de marketing (env públicas). */
export type MarketingConfig = {
  enabled: boolean;
  gtmId: string | null;
  metaPixelId: string | null;
  googleAdsId: string | null;
};

function envFlag(name: string): boolean {
  const value = process.env[name]?.trim().toLowerCase();
  return value === "true" || value === "1";
}

function envId(name: string): string | null {
  const value = process.env[name]?.trim();
  return value || null;
}

export function getMarketingConfig(): MarketingConfig {
  return {
    enabled: envFlag("NEXT_PUBLIC_MARKETING_ENABLED"),
    gtmId: envId("NEXT_PUBLIC_GTM_ID"),
    metaPixelId: envId("NEXT_PUBLIC_META_PIXEL_ID"),
    googleAdsId: envId("NEXT_PUBLIC_GOOGLE_ADS_ID"),
  };
}

export function isMarketingActive(): boolean {
  const config = getMarketingConfig();
  if (!config.enabled) return false;
  return Boolean(config.gtmId || config.metaPixelId || config.googleAdsId);
}
