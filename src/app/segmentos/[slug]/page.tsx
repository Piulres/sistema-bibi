import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPlatformBranding } from "@/lib/theme/branding";
import { buildLandingDescription } from "@/lib/landing/content";
import { getSiteUrl } from "@/lib/landing/site-url";
import { nicheLandingBranding } from "@/lib/niche/branding";
import { getNicheConfig } from "@/lib/niche/defaults";
import { segmentTenantByNiche } from "@/lib/niche/demo-accounts";
import {
  isSegmentLandingSlug,
  nicheFromSegmentSlug,
  SEGMENT_LANDING_PAGES,
} from "@/lib/platform/structure";
import TenantTheme from "@/components/layout/TenantTheme";
import LandingPageView from "@/components/landing/LandingPageView";

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
  const siteUrl = getSiteUrl();
  const title = `${config.name} — ${branding.displayName} · ServiceOS Pay Per Use`;
  const description = buildLandingDescription(config.tagline);
  const canonical = `/segmentos/${slug}`;

  return {
    title,
    description,
    metadataBase: new URL(siteUrl),
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      url: `${siteUrl}${canonical}`,
      siteName: branding.displayName,
      title,
      description,
    },
    keywords: ["serviceos", "pay per use", config.name.toLowerCase(), ...config.landing.keywords],
  };
}

export default async function SegmentLandingPage({ params }: PageProps) {
  const { slug } = await params;
  if (!isSegmentLandingSlug(slug)) notFound();

  const niche = nicheFromSegmentSlug(slug)!;
  const tenantSlug = segmentTenantByNiche(niche).slug;
  const branding = nicheLandingBranding(niche, getPlatformBranding());

  return (
    <TenantTheme branding={branding} className="flex min-h-full flex-col">
      <LandingPageView niche={niche} branding={branding} tenantSlug={tenantSlug} />
    </TenantTheme>
  );
}
