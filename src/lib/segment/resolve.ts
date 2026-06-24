import "server-only";
import { headers } from "next/headers";
import { getPrisma } from "@/lib/db";
import { getDefaultLabels } from "@/lib/niche/defaults";
import { mergeNicheLabels } from "@/lib/niche/labels";
import { segmentTenantBySlug } from "@/lib/niche/demo-accounts";
import { isNicheId, type NicheId, type NicheLabels } from "@/lib/niche/types";
import {
  resolveTenantIdFromHost,
  resolveTenantIdFromSlug,
} from "@/lib/tenant-resolver";
import { readSegmentCookie, readSegmentCookieFromRequest } from "@/lib/segment/cookie";
import { ensureDataStoreForSegmentAccess } from "@/lib/data-store/ensure-data-store-for-segment";
import type { ResolvedSegment } from "@/lib/segment/types";

export type ResolvedSegmentContext = ResolvedSegment & {
  labels: NicheLabels;
};

async function loadTenantSegment(
  tenantId: string,
): Promise<ResolvedSegment & { labels: NicheLabels }> {
  const prisma = await getPrisma();
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, name: true, slug: true, niche: true, labels: true },
  });
  if (!tenant) {
    return {
      niche: "MEDICAL",
      tenantId: null,
      tenantSlug: null,
      tenantName: null,
      labels: getDefaultLabels("MEDICAL"),
    };
  }
  const niche: NicheId =
    tenant.niche && isNicheId(tenant.niche) ? tenant.niche : "MEDICAL";
  return {
    niche,
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    tenantName: tenant.name,
    labels: mergeNicheLabels(niche, tenant.labels),
  };
}

/** Primeiro tenant cadastrado para o nicho (demo multi-segmento). */
export async function resolveTenantIdByNiche(niche: NicheId): Promise<string | null> {
  const prisma = await getPrisma();
  const tenant = await prisma.tenant.findFirst({
    where: { niche },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return tenant?.id ?? null;
}

/**
 * Resolve segmento da requisição.
 * Prioridade: ?tenant= → cookie → domínio customizado → ?niche= → default MEDICAL.
 */
export async function resolveSegmentContext(options?: {
  host?: string | null;
  tenantSlug?: string | null;
  nicheParam?: string | null;
  cookieSegment?: ResolvedSegment | null;
}): Promise<ResolvedSegmentContext> {
  const tenantSlug = options?.tenantSlug?.toLowerCase().trim() || null;
  const nicheParam = options?.nicheParam?.toUpperCase() ?? null;

  try {
    if (tenantSlug) {
      const tenantId = await resolveTenantIdFromSlug(tenantSlug);
      if (tenantId) return loadTenantSegment(tenantId);

      const canonical = segmentTenantBySlug(tenantSlug);
      if (canonical) {
        return {
          niche: canonical.niche,
          tenantId: null,
          tenantSlug: canonical.slug,
          tenantName: canonical.tenant,
          labels: getDefaultLabels(canonical.niche),
        };
      }

      return {
        niche: "MEDICAL",
        tenantId: null,
        tenantSlug,
        tenantName: null,
        labels: getDefaultLabels("MEDICAL"),
      };
    }

    const fromCookie = options?.cookieSegment;
    if (fromCookie?.tenantId) {
      return loadTenantSegment(fromCookie.tenantId);
    }

    const hostTenantId = await resolveTenantIdFromHost(options?.host ?? null);
    if (hostTenantId) return loadTenantSegment(hostTenantId);

    if (nicheParam && isNicheId(nicheParam)) {
      const tenantId = await resolveTenantIdByNiche(nicheParam);
      if (tenantId) return loadTenantSegment(tenantId);
      return {
        niche: nicheParam,
        tenantId: null,
        tenantSlug: null,
        tenantName: null,
        labels: getDefaultLabels(nicheParam),
      };
    }

    if (fromCookie?.niche && isNicheId(fromCookie.niche)) {
      if (fromCookie.tenantId) return loadTenantSegment(fromCookie.tenantId);
      return {
        niche: fromCookie.niche,
        tenantId: null,
        tenantSlug: fromCookie.tenantSlug,
        tenantName: fromCookie.tenantName,
        labels: getDefaultLabels(fromCookie.niche),
      };
    }

    const defaultTenantId = await resolveTenantIdByNiche("MEDICAL");
    if (defaultTenantId) return loadTenantSegment(defaultTenantId);
  } catch {
    // Banco indisponível
  }

  return {
    niche: "MEDICAL",
    tenantId: null,
    tenantSlug: null,
    tenantName: null,
    labels: getDefaultLabels("MEDICAL"),
  };
}

export async function resolveSegmentFromHeaders(options?: {
  tenantSlug?: string | null;
  nicheParam?: string | null;
}): Promise<ResolvedSegmentContext> {
  await ensureDataStoreForSegmentAccess(options?.tenantSlug, options?.nicheParam);

  const h = await headers();
  const cookieSegment = await readSegmentCookie();
  return resolveSegmentContext({
    host: h.get("host"),
    tenantSlug: options?.tenantSlug,
    nicheParam: options?.nicheParam,
    cookieSegment,
  });
}

export async function resolveSegmentFromLoginRequest(
  request: Request,
  body?: { tenantSlug?: string | null; nicheParam?: string | null },
): Promise<ResolvedSegmentContext> {
  await ensureDataStoreForSegmentAccess(body?.tenantSlug, body?.nicheParam);

  const cookieSegment = readSegmentCookieFromRequest(request);
  return resolveSegmentContext({
    host: request.headers.get("host"),
    tenantSlug: body?.tenantSlug ?? null,
    nicheParam: body?.nicheParam ?? null,
    cookieSegment,
  });
}
