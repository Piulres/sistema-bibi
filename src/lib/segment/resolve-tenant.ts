import "server-only";
import { getPrisma } from "@/lib/db";
import { getDefaultLabels } from "@/lib/niche/defaults";
import { mergeNicheLabels } from "@/lib/niche/labels";
import { isNicheId, type NicheId, type NicheLabels } from "@/lib/niche/types";
import type { ResolvedNiche } from "@/lib/niche/resolve";

/** Resolve nicho e labels a partir do tenant (por id). */
export async function resolveNicheFromTenantId(tenantId: string): Promise<ResolvedNiche> {
  const prisma = await getPrisma();
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { niche: true, labels: true, slug: true, name: true },
  });
  const niche: NicheId =
    tenant?.niche && isNicheId(tenant.niche) ? tenant.niche : "MEDICAL";
  return {
    niche,
    labels: mergeNicheLabels(niche, tenant?.labels),
    tenantId,
    tenantSlug: tenant?.slug ?? null,
    tenantName: tenant?.name ?? null,
  };
}

export function fallbackNicheLabels(niche: string): NicheLabels {
  return isNicheId(niche) ? getDefaultLabels(niche) : getDefaultLabels("MEDICAL");
}
