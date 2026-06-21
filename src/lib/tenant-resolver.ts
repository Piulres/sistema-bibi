import "server-only";
import { prisma } from "@/lib/db";

/** Resolve tenantId a partir do Host (domínio customizado white-label). */
export async function resolveTenantIdFromHost(host: string | null): Promise<string | null> {
  if (!host) return null;

  const normalized = host.split(":")[0].toLowerCase().trim();
  if (!normalized || normalized === "localhost" || normalized.endsWith(".netlify.app")) {
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
