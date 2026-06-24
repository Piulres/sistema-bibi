import "server-only";
import { segmentTenantBySlug } from "@/lib/niche/demo-accounts";
import { isNicheId } from "@/lib/niche/types";
import {
  getDataStoreMode,
  isDualDataStoreEnabled,
  setDataStoreMode,
  type DataStoreMode,
} from "@/lib/data-store-mode";
import { invalidatePrismaCache } from "@/lib/db";

/** Tenant padrão do modo operação (bootstrap mínimo). */
export const OPERATION_DEFAULT_TENANT_SLUG = "bibi-saude";

export function isDemoSegmentTenantSlug(slug: string): boolean {
  const normalized = slug.toLowerCase().trim();
  if (!normalized || normalized === OPERATION_DEFAULT_TENANT_SLUG) return false;
  return Boolean(segmentTenantBySlug(normalized));
}

function targetStoreForSegment(
  tenantSlug?: string | null,
  nicheParam?: string | null,
): DataStoreMode | null {
  const slug = tenantSlug?.toLowerCase().trim();
  if (slug === OPERATION_DEFAULT_TENANT_SLUG) return "operation";
  if (slug && isDemoSegmentTenantSlug(slug)) return "demo";

  const niche = nicheParam?.toUpperCase() ?? null;
  if (niche && isNicheId(niche) && niche !== "MEDICAL") return "demo";

  return null;
}

/**
 * Garante o banco correto ao acessar tenants demo (?tenant=lex, horizonte, petcare…)
 * ou o tenant de operação (?tenant=bibi-saude).
 */
export async function ensureDataStoreForSegmentAccess(
  tenantSlug?: string | null,
  nicheParam?: string | null,
): Promise<void> {
  if (!isDualDataStoreEnabled()) return;

  const target = targetStoreForSegment(tenantSlug, nicheParam);
  if (!target) return;

  const current = await getDataStoreMode();
  if (current === target) return;

  await setDataStoreMode(target);
  await invalidatePrismaCache();
}
