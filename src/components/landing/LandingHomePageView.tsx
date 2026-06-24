import type { BrandingTokens } from "@/lib/theme/tokens";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingHeroProduct from "@/components/landing/LandingHeroProduct";
import LandingStats from "@/components/landing/LandingStats";
import {
  LandingHomeProduct,
  LandingHomeValues,
  LandingHomeVision,
} from "@/components/landing/LandingHomeProduct";
import LandingProblem from "@/components/landing/LandingProblem";
import LandingSolution from "@/components/landing/LandingSolution";
import LandingRoi from "@/components/landing/LandingRoi";
import LandingFeatures from "@/components/landing/LandingFeatures";
import LandingPortals from "@/components/landing/LandingPortals";
import LandingNiches from "@/components/landing/LandingNiches";
import LandingFaq from "@/components/landing/LandingFaq";
import LandingCta from "@/components/landing/LandingCta";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingJsonLd from "@/components/landing/LandingJsonLd";
import {
  HOME_CTA,
  HOME_FEATURES,
  HOME_FEATURES_SECTION,
  HOME_FAQ,
  HOME_FOOTER_TAGLINE,
} from "@/lib/landing/home-content";

type Props = {
  branding: BrandingTokens;
};

/** Home — produto, visão, valores e acesso aos 4 portais (sem foco de nicho). */
export default function LandingHomePageView({ branding }: Props) {
  return (
    <>
      <LandingJsonLd branding={branding} />
      <LandingHeader branding={branding} context="home" />
      <main id="conteudo-principal" className="flex-1">
        <LandingHeroProduct branding={branding} />
        <LandingStats />
        <LandingHomeProduct />
        <LandingHomeVision />
        <LandingHomeValues />
        <LandingProblem />
        <LandingSolution />
        <LandingRoi />
        <LandingFeatures
          sectionId="recursos"
          featuresSection={HOME_FEATURES_SECTION}
          features={HOME_FEATURES}
        />
        <LandingNiches />
        <LandingPortals niche="MEDICAL" />
        <LandingFaq items={HOME_FAQ} />
        <LandingCta branding={branding} niche="MEDICAL" description={HOME_CTA} />
      </main>
      <LandingFooter branding={branding} context="home" footerTagline={HOME_FOOTER_TAGLINE} />
    </>
  );
}
