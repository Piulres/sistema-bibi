import "server-only";
import { headers } from "next/headers";
import { getPrisma } from "@/lib/db";
import { resolveTenantIdFromHost } from "@/lib/tenant-resolver";
import { getDefaultLabels } from "@/lib/niche/defaults";
import { mergeNicheLabels } from "@/lib/niche/labels";
import { isNicheId, type NicheId, type NicheLabels } from "@/lib/niche/types";

export type ResolvedNiche = {
  niche: NicheId;
  labels: NicheLabels;
  tenantId: string | null;
};

function parseTenantLabels(raw: string | null | undefined, niche: string): NicheLabels {
  return mergeNicheLabels(niche, raw);
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

/** Resolve nicho da landing pública (domínio customizado, query ?niche= ou default MEDICAL). */
export async function resolveLandingNiche(
  host: string | null,
  nicheOverride?: string | null,
): Promise<ResolvedNiche> {
  if (nicheOverride && isNicheId(nicheOverride)) {
    return {
      niche: nicheOverride,
      labels: getDefaultLabels(nicheOverride),
      tenantId: null,
    };
  }

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

/** Atalho que lê Host dos headers da requisição. */
export async function resolveLandingNicheFromHeaders(
  nicheOverride?: string | null,
): Promise<ResolvedNiche> {
  const h = await headers();
  return resolveLandingNiche(h.get("host"), nicheOverride);
}

export { getNicheConfig } from "@/lib/niche/defaults";
