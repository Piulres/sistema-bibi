import type { Metadata } from "next";
import { getPlatformBranding } from "@/lib/theme/branding";
import { buildLandingDescription } from "@/lib/landing/content";
import { getSiteUrl } from "@/lib/landing/site-url";
import { resolveLandingNicheFromHeaders } from "@/lib/niche/resolve";
import { nicheLandingBranding } from "@/lib/niche/branding";
import { getNicheConfig } from "@/lib/niche/defaults";
import TenantTheme from "@/components/layout/TenantTheme";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingNicheSwitcherBar from "@/components/landing/LandingNicheSwitcherBar";
import LandingHeroNiche from "@/components/landing/LandingHeroNiche";
import LandingStats from "@/components/landing/LandingStats";
import LandingFeatures from "@/components/landing/LandingFeatures";
import LandingHowItWorks from "@/components/landing/LandingHowItWorks";
import LandingPortals from "@/components/landing/LandingPortals";
import LandingFaq from "@/components/landing/LandingFaq";
import LandingCta from "@/components/landing/LandingCta";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingJsonLd from "@/components/landing/LandingJsonLd";
import { persistSegmentCookie } from "@/lib/segment/cookie";

type PageProps = {
  searchParams: Promise<{ niche?: string; tenant?: string }>;
};

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { niche: nicheParam, tenant: tenantParam } = await searchParams;
  const resolved = await resolveLandingNicheFromHeaders(nicheParam, tenantParam);
  const config = getNicheConfig(resolved.niche);
  const branding = nicheLandingBranding(resolved.niche, getPlatformBranding());
  const siteUrl = getSiteUrl();
  const title = `${branding.displayName} — ${config.name} · ServiceOS Pay Per Use`;
  const description = buildLandingDescription(config.tagline);

  return {
    title,
    description,
    metadataBase: new URL(siteUrl),
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      url: siteUrl,
      siteName: branding.displayName,
      title,
      description,
      ...(branding.logoUrl ? { images: [{ url: branding.logoUrl, alt: branding.displayName }] } : {}),
    },
    twitter: {
      card: branding.logoUrl ? "summary_large_image" : "summary",
      title,
      description,
      ...(branding.logoUrl ? { images: [branding.logoUrl] } : {}),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
    keywords: [
      "serviceos",
      "pay per use",
      "multi-nicho",
      "white label",
      ...config.landing.keywords,
    ],
  };
}

export default async function Home({ searchParams }: PageProps) {
  const { niche: nicheParam, tenant: tenantParam } = await searchParams;
  const resolved = await resolveLandingNicheFromHeaders(nicheParam, tenantParam);
  await persistSegmentCookie({
    niche: resolved.niche,
    tenantId: resolved.tenantId,
    tenantSlug: resolved.tenantSlug ?? null,
    tenantName: resolved.tenantName ?? null,
  });
  const branding = nicheLandingBranding(resolved.niche, getPlatformBranding());
  const segment = {
    tenantSlug: resolved.tenantSlug,
    niche: resolved.niche,
  };

  return (
    <TenantTheme branding={branding} className="flex min-h-full flex-col">
      <LandingJsonLd branding={branding} />
      <LandingHeader branding={branding} />
      <LandingNicheSwitcherBar />
      <main id="conteudo-principal" className="flex-1">
        <LandingHeroNiche niche={resolved.niche} branding={branding} />
        <LandingStats />
        <LandingFeatures niche={resolved.niche} />
        <LandingHowItWorks niche={resolved.niche} />
        <LandingPortals niche={resolved.niche} segment={segment} />
        <LandingFaq niche={resolved.niche} />
        <LandingCta branding={branding} niche={resolved.niche} />
      </main>
      <LandingFooter branding={branding} niche={resolved.niche} />
    </TenantTheme>
  );
}
