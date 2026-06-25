import type { PortalKey } from "@/lib/roles";
import type { NicheId } from "@/lib/niche/types";
import {
  SEGMENT_TENANTS,
  segmentTenantByNiche,
  segmentTenantBySlug,
  type SegmentTenantRef,
} from "@/lib/niche/demo-accounts";

const PJ_DEMO_EMAIL = "rh@techcorp.com";
const BENEFICIARIO_DEMO_EMAIL = "joao.pereira@email.com";

export const PORTAL_LOGIN_PATHS: Record<PortalKey, string> = {
  prestador: "/login",
  interno: "/interno/login",
  pj: "/pj/login",
  beneficiario: "/beneficiario/login",
};

export function resolveSegmentTenantRef(
  tenantSlug: string | null | undefined,
  niche: NicheId,
): SegmentTenantRef {
  if (tenantSlug) {
    return (
      segmentTenantBySlug(tenantSlug) ??
      SEGMENT_TENANTS.find((t) => t.slug === tenantSlug.toLowerCase()) ??
      segmentTenantByNiche(niche)
    );
  }
  return segmentTenantByNiche(niche);
}

export function demoEmailForPortal(ref: SegmentTenantRef, portal: PortalKey): string {
  switch (portal) {
    case "interno":
      return ref.internoEmail;
    case "prestador":
      return ref.providerEmail;
    case "pj":
      return PJ_DEMO_EMAIL;
    case "beneficiario":
      return BENEFICIARIO_DEMO_EMAIL;
  }
}

export type LoginNicheDemoOption = {
  niche: NicheId;
  slug: string;
  tenant: string;
};

export function loginNicheDemoOptions(): LoginNicheDemoOption[] {
  return SEGMENT_TENANTS.map(({ niche, slug, tenant }) => ({ niche, slug, tenant }));
}
