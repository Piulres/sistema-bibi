import "server-only";
import { headers } from "next/headers";
import { getPrisma } from "@/lib/db";
import {
  CLINIC_BRANDING_DEFAULTS,
  LOGIN_PORTAL_BRANDING,
  PLATFORM_BRANDING,
  type BrandingTokens,
} from "@/lib/theme/tokens";
import { normalizeColorScheme } from "@/lib/theme/color-scheme";
import { brandingToCssVars } from "@/lib/theme/css-vars";
import { resolveTenantIdFromHost } from "@/lib/tenant-resolver";

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

function tenantBrandingFallback(tenantId: string, tenantName: string): TenantBrandingRecord {
  return {
    tenantId,
    displayName: tenantName,
    ...CLINIC_BRANDING_DEFAULTS,
  };
}

/** Busca branding do tenant ou retorna defaults da clínica (nome do tenant). */
export async function getTenantBranding(
  tenantId: string,
): Promise<TenantBrandingRecord> {
  const prisma = await getPrisma();
  const row = await prisma.tenantBranding.findUnique({ where: { tenantId } });
  if (row) return fromDb(row);

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true },
  });
  return tenantBrandingFallback(tenantId, tenant?.name ?? "Clínica");
}

/** Branding da plataforma ServiceOS Bibi — landing e páginas comerciais. */
export function getPlatformBranding(): BrandingTokens {
  return { ...PLATFORM_BRANDING };
}

function brandingTokensFromTenant(record: TenantBrandingRecord): BrandingTokens {
  return {
    displayName: record.displayName,
    tagline: record.tagline,
    logoUrl: record.logoUrl,
    primaryColor: record.primaryColor,
    accentColor: record.accentColor,
    heroFrom: record.heroFrom,
    heroTo: record.heroTo,
    platformLabel: record.platformLabel,
    colorScheme: record.colorScheme,
    customDomain: record.customDomain,
    customDomainVerified: record.customDomainVerified,
  };
}

/** Branding do login: tenant por domínio customizado ou shell neutro de clínica. */
export async function getLoginBranding(host: string | null): Promise<BrandingTokens> {
  try {
    const tenantId = await resolveTenantIdFromHost(host);
    if (tenantId) {
      return brandingTokensFromTenant(await getTenantBranding(tenantId));
    }
  } catch {
    // Banco indisponível — segue com shell neutro
  }
  return { ...LOGIN_PORTAL_BRANDING };
}

/** Atalho para páginas de login (lê Host dos headers da requisição). */
export async function getLoginBrandingFromHeaders(): Promise<BrandingTokens> {
  const h = await headers();
  return getLoginBranding(h.get("host"));
}
