import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPlatformBranding } from "@/lib/theme/branding";
import { PLATFORM } from "@/lib/platform";
import { buildLandingMetadata } from "@/lib/landing/metadata";
import { segmentTenantBySlug } from "@/lib/niche/demo-accounts";
import { segmentLandingHref } from "@/lib/platform/structure";
import TenantTheme from "@/components/layout/TenantTheme";
import LandingHomePageView from "@/components/landing/LandingHomePageView";

type PageProps = {
  searchParams: Promise<{ niche?: string; tenant?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const title = `${PLATFORM.name} — ${PLATFORM.tagline}`;

  return buildLandingMetadata({
    title,
    description: PLATFORM.description,
    canonicalPath: "/",
    keywords: [
      "serviceos",
      "pay per use",
      "multi-nicho",
      "white label",
      "sistema bibi",
      "infraestrutura b2b",
    ],
  });
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
