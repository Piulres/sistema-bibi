import "server-only";
import { applyNicheBrandingDefaults, nicheLandingBranding } from "@/lib/niche/branding";
import { getNicheConfig } from "@/lib/niche/defaults";
import { getTenantBranding } from "@/lib/theme/branding";
import { LOGIN_PORTAL_BRANDING, type BrandingTokens } from "@/lib/theme/tokens";
import type { NicheId, NicheLabels } from "@/lib/niche/types";
import { resolveSegmentFromHeaders } from "@/lib/segment/resolve";
import { resolveSegmentTenantRef } from "@/lib/segment/login-demo";
import type { ResolvedSegment } from "@/lib/segment/types";

export type LoginSegmentContext = ResolvedSegment & {
  nicheName: string;
  labels: NicheLabels;
  branding: BrandingTokens;
};

/** Contexto completo de segmento para páginas de login (branding + vocabulário + tenant). */
export async function getLoginSegmentContext(options?: {
  tenantSlug?: string | null;
  nicheParam?: string | null;
}): Promise<LoginSegmentContext> {
  const segment = await resolveSegmentFromHeaders(options);
  const nicheName = getNicheConfig(segment.niche).name;

  let branding: BrandingTokens = { ...LOGIN_PORTAL_BRANDING };
  if (segment.tenantId) {
    const tenantBranding = await getTenantBranding(segment.tenantId);
    branding = applyNicheBrandingDefaults(segment.niche, {
      displayName: tenantBranding.displayName,
      tagline: tenantBranding.tagline,
      logoUrl: tenantBranding.logoUrl,
      primaryColor: tenantBranding.primaryColor,
      accentColor: tenantBranding.accentColor,
      heroFrom: tenantBranding.heroFrom,
      heroTo: tenantBranding.heroTo,
      platformLabel: tenantBranding.platformLabel,
      colorScheme: tenantBranding.colorScheme,
      customDomain: tenantBranding.customDomain,
      customDomainVerified: tenantBranding.customDomainVerified,
    }, { fromDatabase: true });
  } else {
    const ref = resolveSegmentTenantRef(segment.tenantSlug, segment.niche);
    branding = nicheLandingBranding(segment.niche, {
      ...LOGIN_PORTAL_BRANDING,
      displayName: ref.tenant,
      tagline: getNicheConfig(segment.niche).tagline,
    });
  }

  return {
    niche: segment.niche,
    nicheName,
    tenantId: segment.tenantId,
    tenantSlug: segment.tenantSlug,
    tenantName: segment.tenantName,
    labels: segment.labels,
    branding,
  };
}

export type LoginSegmentPayload = {
  niche: NicheId;
  nicheName: string;
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
};

export function toLoginSegmentPayload(
  user: { tenantId: string },
  tenant: { slug: string; name: string; niche: string },
): LoginSegmentPayload {
  const niche = (tenant.niche as NicheId) || "MEDICAL";
  return {
    niche,
    nicheName: getNicheConfig(niche).name,
    tenantId: user.tenantId,
    tenantSlug: tenant.slug,
    tenantName: tenant.name,
  };
}
