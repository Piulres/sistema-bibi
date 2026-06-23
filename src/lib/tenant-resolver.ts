import "server-only";
import { getPrisma } from "@/lib/db";

function parseDevHostMap(): Record<string, string> {
  const raw = process.env.DEV_TENANT_HOST_MAP;
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

/** Resolve tenantId a partir do slug (?tenant=petcare). */
export async function resolveTenantIdFromSlug(slug: string | null): Promise<string | null> {
  if (!slug) return null;
  const normalized = slug.toLowerCase().trim();
  if (!normalized) return null;

  const prisma = await getPrisma();
  const tenant = await prisma.tenant.findUnique({
    where: { slug: normalized },
    select: { id: true },
  });
  return tenant?.id ?? null;
}

/** Resolve tenantId a partir do Host (domínio customizado white-label). */
export async function resolveTenantIdFromHost(host: string | null): Promise<string | null> {
  const prisma = await getPrisma();
  if (!host) return null;

  const normalized = host.split(":")[0].toLowerCase().trim();
  if (!normalized) return null;

  const devMap = parseDevHostMap();
  if (devMap[normalized]) {
    return resolveTenantIdFromSlug(devMap[normalized]);
  }

  if (normalized === "localhost" || normalized.endsWith(".netlify.app")) {
    return null;
  }

  const branding = await prisma.tenantBranding.findFirst({
    where: {
      customDomain: normalized,
      customDomainVerified: true,
    },
    select: { tenantId: true },
  });

  return branding?.tenantId ?? null;
}
