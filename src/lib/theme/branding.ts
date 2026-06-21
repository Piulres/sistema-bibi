import "server-only";
import { prisma } from "@/lib/db";
import { DEFAULT_BRANDING, type BrandingTokens } from "@/lib/theme/tokens";
import { normalizeColorScheme } from "@/lib/theme/color-scheme";
import { brandingToCssVars } from "@/lib/theme/css-vars";

export { brandingToCssVars };

export type TenantBrandingRecord = BrandingTokens & { tenantId: string };

function fromDb(
  row: {
    tenantId: string;
    displayName: string;
    tagline: string | null;
    logoUrl: string | null;
    primaryColor: string;
    accentColor: string;
    heroFrom: string;
    heroTo: string;
    platformLabel: string;
    colorScheme: string;
    customDomain: string | null;
    customDomainVerified: boolean;
  },
): TenantBrandingRecord {
  return {
    tenantId: row.tenantId,
    displayName: row.displayName,
    tagline: row.tagline,
    logoUrl: row.logoUrl,
    primaryColor: row.primaryColor,
    accentColor: row.accentColor,
    heroFrom: row.heroFrom,
    heroTo: row.heroTo,
    platformLabel: row.platformLabel,
    colorScheme: normalizeColorScheme(row.colorScheme),
    customDomain: row.customDomain,
    customDomainVerified: row.customDomainVerified,
  };
}

/** Busca branding do tenant ou retorna defaults da plataforma. */
export async function getTenantBranding(
  tenantId: string,
): Promise<TenantBrandingRecord> {
  const row = await prisma.tenantBranding.findUnique({ where: { tenantId } });
  if (!row) {
    return { tenantId, ...DEFAULT_BRANDING };
  }
  return fromDb(row);
}

/** Branding padrao para paginas publicas (landing/login) — primeiro tenant demo ou fallback. */
export async function getPlatformBranding(): Promise<BrandingTokens> {
  const row = await prisma.tenantBranding.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (!row) return { ...DEFAULT_BRANDING };
  return fromDb(row);
}
