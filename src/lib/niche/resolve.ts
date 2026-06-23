import "server-only";
import { resolveSegmentFromHeaders } from "@/lib/segment/resolve";
import type { NicheId, NicheLabels } from "@/lib/niche/types";

export type ResolvedNiche = {
  niche: NicheId;
  labels: NicheLabels;
  tenantId: string | null;
  tenantSlug?: string | null;
  tenantName?: string | null;
};

/** @deprecated Prefer `resolveSegmentFromHeaders` — mantido para compatibilidade da landing. */
export async function resolveLandingNicheFromHeaders(
  nicheOverride?: string | null,
  tenantSlug?: string | null,
): Promise<ResolvedNiche> {
  const segment = await resolveSegmentFromHeaders({
    nicheParam: nicheOverride,
    tenantSlug,
  });
  return {
    niche: segment.niche,
    labels: segment.labels,
    tenantId: segment.tenantId,
    tenantSlug: segment.tenantSlug,
    tenantName: segment.tenantName,
  };
}

export { getNicheConfig } from "@/lib/niche/defaults";
export { resolveNicheFromTenantId } from "@/lib/segment/resolve-tenant";
