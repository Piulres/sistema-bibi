import "server-only";
import { SEGMENT_TENANTS } from "@/lib/niche/demo-accounts";
import {
  getDataStoreMode,
  isDualDataStoreEnabled,
  setDataStoreMode,
  type DataStoreMode,
} from "@/lib/data-store-mode";
import { invalidatePrismaCache } from "@/lib/db";

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

export function isDemoSegmentTenantSlug(slug: string | null | undefined): boolean {
  if (!slug) return false;
  return DEMO_SEGMENT_TENANT_SLUGS.has(slug.toLowerCase());
}

export function isDemoOnlySegmentEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return DEMO_ONLY_SEGMENT_EMAILS.has(email.toLowerCase().trim());
}

export type EnsureDemoForSegmentOptions = {
  tenantSlug?: string | null;
  nicheParam?: string | null;
  email?: string | null;
  segmentLanding?: boolean;
};

/**
 * Garante modo demo quando o fluxo é de demonstração segmentada.
 * Operação real (`bibi-saude`) permanece no modo operação.
 */
export async function ensureDemoDataStoreForSegmentAccess(
  options: EnsureDemoForSegmentOptions = {},
): Promise<DataStoreMode> {
  if (!isDualDataStoreEnabled()) {
    return getDataStoreMode();
  }

  const niche = options.nicheParam?.toUpperCase() ?? null;
  const needsDemo =
    options.segmentLanding === true ||
    isDemoSegmentTenantSlug(options.tenantSlug) ||
    isDemoOnlySegmentEmail(options.email) ||
    (niche !== null && niche !== "MEDICAL");

  if (!needsDemo) {
    return getDataStoreMode();
  }

  const current = await getDataStoreMode();
  if (current === "demo") {
    return current;
  }

  await setDataStoreMode("demo");
  await invalidatePrismaCache();
  return "demo";
}
