import "server-only";
import { SEGMENT_TENANTS } from "@/lib/niche/demo-accounts";
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

/** Tenants de operação real (não forçam massa demo). */
export const OPERATION_TENANT_SLUGS = new Set([
  OPERATION_DEFAULT_TENANT_SLUG,
  "cedig",
]);

/** Slugs dos tenants demo por segmento (horizonte, petcare, smile…). */
export const DEMO_SEGMENT_TENANT_SLUGS = new Set(
  SEGMENT_TENANTS.map((tenant) => tenant.slug),
);

const HORIZONTE_DEMO = SEGMENT_TENANTS.find((tenant) => tenant.slug === "horizonte");

/** E-mails presentes em demo e operação — o tenant vem de `?tenant=` / cookie. */
const SHARED_OPERATION_EMAILS = new Set(
  HORIZONTE_DEMO
    ? [HORIZONTE_DEMO.internoEmail, HORIZONTE_DEMO.providerEmail].map((e) => e.toLowerCase())
    : [],
);

/**
 * E-mails exclusivos do modo demo (ex.: operacao@petcare.demo).
 * Contas compartilhadas (faturamento@bibi.health) exigem `?tenant=horizonte`.
 */
export const DEMO_ONLY_SEGMENT_EMAILS = new Set(
  SEGMENT_TENANTS.flatMap((tenant) => [tenant.internoEmail, tenant.providerEmail])
    .map((email) => email.toLowerCase())
    .filter((email) => !SHARED_OPERATION_EMAILS.has(email)),
);

export function isOperationTenantSlug(slug: string | null | undefined): boolean {
  if (!slug) return false;
  return OPERATION_TENANT_SLUGS.has(slug.toLowerCase().trim());
}

export function isDemoSegmentTenantSlug(slug: string | null | undefined): boolean {
  if (!slug) return false;
  const normalized = slug.toLowerCase().trim();
  if (isOperationTenantSlug(normalized)) return false;
  return DEMO_SEGMENT_TENANT_SLUGS.has(normalized);
}

export function isDemoOnlySegmentEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return DEMO_ONLY_SEGMENT_EMAILS.has(email.toLowerCase().trim());
}

export type EnsureDataStoreForSegmentOptions = {
  tenantSlug?: string | null;
  nicheParam?: string | null;
  email?: string | null;
  segmentLanding?: boolean;
};

function targetStoreForSegment(options: EnsureDataStoreForSegmentOptions): DataStoreMode | null {
  const slug = options.tenantSlug?.toLowerCase().trim();
  if (slug && isOperationTenantSlug(slug)) return "operation";
  if (slug && isDemoSegmentTenantSlug(slug)) return "demo";

  if (options.segmentLanding) return "demo";
  if (isDemoOnlySegmentEmail(options.email)) return "demo";

  const niche = options.nicheParam?.toUpperCase() ?? null;
  if (niche && isNicheId(niche) && niche !== "MEDICAL") return "demo";

  return null;
}

/**
 * Garante o banco correto ao acessar tenants demo (?tenant=lex, horizonte, petcare…),
 * landing de segmento, e-mail demo exclusivo ou tenant de operação (?tenant=bibi-saude|cedig).
 *
 * Regra de proteção: se o site já está em **operação**, não rebaixa automaticamente
 * para demo (landing/segmento/e-mail). Só ADMIN via `/interno/seguranca` volta à demo.
 * Assim walk-in e dados reais da CEDIG não somem ao abrir `/segmentos/*`.
 */
export async function ensureDataStoreForSegmentAccess(
  options: EnsureDataStoreForSegmentOptions = {},
): Promise<DataStoreMode> {
  if (!isDualDataStoreEnabled()) {
    return getDataStoreMode();
  }

  const current = await getDataStoreMode();
  const target = targetStoreForSegment(options);

  if (!target) {
    return current;
  }

  if (current === target) {
    return current;
  }

  // Protege base real: nunca demo automática a partir de operação.
  if (current === "operation" && target === "demo") {
    return current;
  }

  await setDataStoreMode(target);
  await invalidatePrismaCache();
  return target;
}
