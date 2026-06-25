import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPlatformBranding } from "@/lib/theme/branding";
import { buildLandingDescription } from "@/lib/landing/content";
import { buildLandingMetadata } from "@/lib/landing/metadata";
import { nicheLandingBranding } from "@/lib/niche/branding";
import { getNicheConfig } from "@/lib/niche/defaults";
import { segmentTenantByNiche } from "@/lib/niche/demo-accounts";
import { ensureDataStoreForSegmentAccess } from "@/lib/data-store/ensure-data-store-for-segment";
import {
  isSegmentLandingSlug,
  nicheFromSegmentSlug,
  SEGMENT_LANDING_PAGES,
} from "@/lib/platform/structure";
import TenantTheme from "@/components/layout/TenantTheme";
import LandingSegmentPageView from "@/components/landing/LandingSegmentPageView";
import SegmentLandingTracker from "@/components/marketing/SegmentLandingTracker";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return SEGMENT_LANDING_PAGES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!isSegmentLandingSlug(slug)) {
    return { title: "Segmento não encontrado" };
  }

  const niche = nicheFromSegmentSlug(slug)!;
  const config = getNicheConfig(niche);
  const branding = nicheLandingBranding(niche, getPlatformBranding());
  const title = `${config.name} — ${branding.displayName} · ServiceOS Pay Per Use`;
  const description = buildLandingDescription(config.tagline);
  const canonical = `/segmentos/${slug}`;

  return buildLandingMetadata({
    title,
    description,
    canonicalPath: canonical,
    keywords: ["serviceos", "pay per use", config.name.toLowerCase(), ...config.landing.keywords],
  });
}

export default async function SegmentLandingPage({ params }: PageProps) {
  const { slug } = await params;
  if (!isSegmentLandingSlug(slug)) notFound();

  const niche = nicheFromSegmentSlug(slug)!;
  const tenantSlug = segmentTenantByNiche(niche).slug;
  await ensureDataStoreForSegmentAccess({ segmentLanding: true, tenantSlug });
  const branding = nicheLandingBranding(niche, getPlatformBranding());

  return (
    <TenantTheme branding={branding} className="flex min-h-full flex-col">
      <SegmentLandingTracker segmentSlug={slug} niche={niche} />
      <LandingSegmentPageView niche={niche} branding={branding} tenantSlug={tenantSlug} />
    </TenantTheme>
  );
}
