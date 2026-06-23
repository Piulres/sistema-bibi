import type { Metadata } from "next";
import { headers } from "next/headers";
import { getPlatformBranding } from "@/lib/theme/branding";
import { buildLandingDescription } from "@/lib/landing/content";
import { getSiteUrl } from "@/lib/landing/site-url";
import { resolveLandingNiche } from "@/lib/niche/resolve";
import { nicheLandingBranding } from "@/lib/niche/branding";
import { getNicheConfig } from "@/lib/niche/defaults";
import TenantTheme from "@/components/layout/TenantTheme";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingHeroNiche from "@/components/landing/LandingHeroNiche";
import LandingStats from "@/components/landing/LandingStats";
import LandingFeatures from "@/components/landing/LandingFeatures";
import LandingHowItWorks from "@/components/landing/LandingHowItWorks";
import LandingPortals from "@/components/landing/LandingPortals";
import LandingFaq from "@/components/landing/LandingFaq";
import LandingCta from "@/components/landing/LandingCta";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingJsonLd from "@/components/landing/LandingJsonLd";

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const resolved = await resolveLandingNiche(h.get("host"));
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

export default async function Home() {
  const h = await headers();
  const resolved = await resolveLandingNiche(h.get("host"));
  const branding = nicheLandingBranding(resolved.niche, getPlatformBranding());

  return (
    <TenantTheme branding={branding} className="flex min-h-full flex-col">
      <LandingJsonLd branding={branding} />
      <LandingHeader branding={branding} />
      <main id="conteudo-principal" className="flex-1">
        <LandingHeroNiche niche={resolved.niche} branding={branding} />
        <LandingStats />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingPortals />
        <LandingFaq />
        <LandingCta branding={branding} />
      </main>
      <LandingFooter branding={branding} />
    </TenantTheme>
  );
}
