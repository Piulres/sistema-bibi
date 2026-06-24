import { Suspense } from "react";
import type { NicheId } from "@/lib/niche/types";
import type { BrandingTokens } from "@/lib/theme/tokens";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingNicheSwitcherBar from "@/components/landing/LandingNicheSwitcherBar";
import LandingHeroNiche from "@/components/landing/LandingHeroNiche";
import LandingFeatures from "@/components/landing/LandingFeatures";
import LandingHowItWorks from "@/components/landing/LandingHowItWorks";
import LandingPortals from "@/components/landing/LandingPortals";
import LandingFaq from "@/components/landing/LandingFaq";
import LandingCta from "@/components/landing/LandingCta";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingJsonLd from "@/components/landing/LandingJsonLd";
import SegmentCookiePersist from "@/components/segment/SegmentCookiePersist";

type Props = {
  niche: NicheId;
  branding: BrandingTokens;
  tenantSlug: string;
};

/** Segmentos — plataforma focada no nicho, com switcher e portais segmentados. */
export default function LandingSegmentPageView({ niche, branding, tenantSlug }: Props) {
  const segment = { tenantSlug, niche };

  return (
    <>
      <Suspense fallback={null}>
        <SegmentCookiePersist tenantSlug={tenantSlug} niche={niche} />
      </Suspense>
      <LandingJsonLd branding={branding} />
      <LandingHeader branding={branding} context="segment" />
      <LandingNicheSwitcherBar />
      <main id="conteudo-principal" className="flex-1">
        <LandingHeroNiche niche={niche} branding={branding} />
        <LandingFeatures niche={niche} />
        <LandingHowItWorks niche={niche} />
        <LandingPortals niche={niche} segment={segment} />
        <LandingFaq niche={niche} />
        <LandingCta branding={branding} niche={niche} />
      </main>
      <LandingFooter branding={branding} context="segment" niche={niche} />
    </>
  );
}
