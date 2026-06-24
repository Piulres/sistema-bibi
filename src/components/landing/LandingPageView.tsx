import { Suspense } from "react";
import type { NicheId } from "@/lib/niche/types";
import type { BrandingTokens } from "@/lib/theme/tokens";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingNicheSwitcherBar from "@/components/landing/LandingNicheSwitcherBar";
import LandingHeroNiche from "@/components/landing/LandingHeroNiche";
import LandingStats from "@/components/landing/LandingStats";
import LandingProblem from "@/components/landing/LandingProblem";
import LandingSolution from "@/components/landing/LandingSolution";
import LandingRoi from "@/components/landing/LandingRoi";
import LandingFeatures from "@/components/landing/LandingFeatures";
import LandingHowItWorks from "@/components/landing/LandingHowItWorks";
import LandingPortals from "@/components/landing/LandingPortals";
import LandingNiches from "@/components/landing/LandingNiches";
import LandingFaq from "@/components/landing/LandingFaq";
import LandingCta from "@/components/landing/LandingCta";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingJsonLd from "@/components/landing/LandingJsonLd";
import SegmentCookiePersist from "@/components/segment/SegmentCookiePersist";

type Props = {
  niche: NicheId;
  branding: BrandingTokens;
  tenantSlug?: string | null;
};

/** Landing completa por segmento — reutilizada em `/` e `/segmentos/[slug]`. */
export default function LandingPageView({ niche, branding, tenantSlug }: Props) {
  const segment = { tenantSlug, niche };

  return (
    <>
      <Suspense fallback={null}>
        <SegmentCookiePersist tenantSlug={tenantSlug} niche={niche} />
      </Suspense>
      <LandingJsonLd branding={branding} />
      <LandingHeader branding={branding} />
      <LandingNicheSwitcherBar />
      <main id="conteudo-principal" className="flex-1">
        <LandingHeroNiche niche={niche} branding={branding} />
        <LandingStats />
        <LandingProblem />
        <LandingSolution />
        <LandingRoi />
        <LandingFeatures niche={niche} />
        <LandingHowItWorks niche={niche} />
        <LandingPortals niche={niche} segment={segment} />
        <LandingNiches />
        <LandingFaq niche={niche} />
        <LandingCta branding={branding} niche={niche} />
      </main>
      <LandingFooter branding={branding} niche={niche} />
    </>
  );
}
