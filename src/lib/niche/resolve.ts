import "server-only";
import { getPrisma } from "@/lib/db";
import { resolveTenantIdFromHost } from "@/lib/tenant-resolver";
import { getDefaultLabels, getNicheConfig } from "@/lib/niche/defaults";
import { isNicheId, type NicheId, type NicheLabels } from "@/lib/niche/types";

export type ResolvedNiche = {
  niche: NicheId;
  labels: NicheLabels;
  tenantId: string | null;
};

function parseTenantLabels(raw: string | null | undefined, niche: string): NicheLabels {
  const defaults = getDefaultLabels(niche);
  if (!raw) return defaults;
  try {
    const parsed = JSON.parse(raw) as Partial<NicheLabels>;
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

/** Resolve nicho e labels a partir do tenant (por id ou host). */
export async function resolveNicheFromTenantId(tenantId: string): Promise<ResolvedNiche> {
  const prisma = await getPrisma();
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { niche: true, labels: true },
  });
  const niche = tenant?.niche && isNicheId(tenant.niche) ? tenant.niche : "MEDICAL";
  return {
    niche,
    labels: parseTenantLabels(tenant?.labels, niche),
    tenantId,
  };
}

/** Resolve nicho da landing pública (domínio customizado ou default MEDICAL). */
export async function resolveLandingNiche(host: string | null): Promise<ResolvedNiche> {
  try {
    const tenantId = await resolveTenantIdFromHost(host);
    if (tenantId) return resolveNicheFromTenantId(tenantId);
  } catch {
    // Banco indisponível — segue com default
  }
  return {
    niche: "MEDICAL",
    labels: getDefaultLabels("MEDICAL"),
    tenantId: null,
  };
}

/** Mescla labels do tenant com defaults do nicho. */
export function mergeNicheLabels(niche: string, rawLabels: string | null | undefined): NicheLabels {
  return parseTenantLabels(rawLabels, niche);
}

export { getNicheConfig };
