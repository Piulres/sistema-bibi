import type { BrandingTokens } from "@/lib/theme/tokens";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingHeroProduct from "@/components/landing/LandingHeroProduct";
import LandingStats from "@/components/landing/LandingStats";
import LandingSocialProof from "@/components/landing/LandingSocialProof";
import {
  LandingHomeProduct,
  LandingHomeValues,
  LandingHomeVision,
} from "@/components/landing/LandingHomeProduct";
import LandingHomeAudience from "@/components/landing/LandingHomeAudience";
import LandingProblem from "@/components/landing/LandingProblem";
import LandingSolution from "@/components/landing/LandingSolution";
import LandingRoiCalculator from "@/components/landing/LandingRoiCalculator";
import LandingCompare from "@/components/landing/LandingCompare";
import LandingValidatedScenarios from "@/components/landing/LandingValidatedScenarios";
import LandingDemoVideo from "@/components/landing/LandingDemoVideo";
import LandingLeadForm from "@/components/landing/LandingLeadForm";
import LandingChangelog from "@/components/landing/LandingChangelog";
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

/** Home — funil de captação: dor → solução → prova → segmento → demo. */
export default function LandingHomePageView({ branding }: Props) {
  return (
    <>
      <LandingJsonLd branding={branding} />
      <LandingHeader branding={branding} context="home" />
      <main id="conteudo-principal" className="flex-1">
        <LandingHeroProduct />
        <LandingStats />
        <LandingSocialProof />
        <LandingProblem />
        <LandingSolution />
        <LandingDemoVideo />
        <LandingRoiCalculator />
        <LandingValidatedScenarios />
        <LandingCompare />
        <LandingHomeAudience />
        <LandingNiches />
        <LandingFeatures
          sectionId="recursos"
          featuresSection={HOME_FEATURES_SECTION}
          features={HOME_FEATURES}
        />
        <LandingHomeProduct />
        <LandingHomeVision />
        <LandingHomeValues />
        <LandingPortals niche="MEDICAL" branding={branding} />
        <LandingFaq items={HOME_FAQ} />
        <LandingChangelog />
        <LandingLeadForm />
        <LandingCta branding={branding} niche="MEDICAL" description={HOME_CTA} />
      </main>
      <LandingFooter branding={branding} context="home" footerTagline={HOME_FOOTER_TAGLINE} />
    </>
  );
}
