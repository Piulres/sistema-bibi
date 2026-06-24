import type { Metadata } from "next";
import { getPlatformBranding } from "@/lib/theme/branding";
import { buildLandingDescription } from "@/lib/landing/content";
import { getSiteUrl } from "@/lib/landing/site-url";
import { resolveLandingNicheFromHeaders } from "@/lib/niche/resolve";
import { nicheLandingBranding } from "@/lib/niche/branding";
import { getNicheConfig } from "@/lib/niche/defaults";
import TenantTheme from "@/components/layout/TenantTheme";
import LandingPageView from "@/components/landing/LandingPageView";

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
  const branding = nicheLandingBranding(resolved.niche, getPlatformBranding());

  return (
    <TenantTheme branding={branding} className="flex min-h-full flex-col">
      <LandingPageView
        niche={resolved.niche}
        branding={branding}
        tenantSlug={resolved.tenantSlug}
      />
    </TenantTheme>
  );
}
