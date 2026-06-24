import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPlatformBranding } from "@/lib/theme/branding";
import { PLATFORM } from "@/lib/platform";
import { getSiteUrl } from "@/lib/landing/site-url";
import { segmentTenantBySlug } from "@/lib/niche/demo-accounts";
import { segmentLandingHref } from "@/lib/platform/structure";
import TenantTheme from "@/components/layout/TenantTheme";
import LandingHomePageView from "@/components/landing/LandingHomePageView";

type PageProps = {
  searchParams: Promise<{ niche?: string; tenant?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const branding = getPlatformBranding();
  const siteUrl = getSiteUrl();
  const title = `${PLATFORM.name} — ${PLATFORM.tagline}`;
  const description = PLATFORM.description;

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
    },
    keywords: [
      "serviceos",
      "pay per use",
      "multi-nicho",
      "white label",
      "sistema bibi",
    ],
  };
}

export default async function Home({ searchParams }: PageProps) {
  const { tenant: tenantParam } = await searchParams;

  if (tenantParam) {
    const ref = segmentTenantBySlug(tenantParam);
    if (ref) {
      redirect(segmentLandingHref(ref.niche));
    }
  }

  const branding = getPlatformBranding();

  return (
    <TenantTheme branding={branding} className="flex min-h-full flex-col">
      <LandingHomePageView branding={branding} />
    </TenantTheme>
  );
}
