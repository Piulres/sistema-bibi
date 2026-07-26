import type { BrandingTokens } from "@/lib/theme/tokens";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingHeroProduct from "@/components/landing/LandingHeroProduct";
import LandingStats from "@/components/landing/LandingStats";
import LandingProblem from "@/components/landing/LandingProblem";
import LandingSolution from "@/components/landing/LandingSolution";
import LandingHowItWorks from "@/components/landing/LandingHowItWorks";
import LandingNiches from "@/components/landing/LandingNiches";
import LandingFeatures from "@/components/landing/LandingFeatures";
import LandingHomeAudience from "@/components/landing/LandingHomeAudience";
import LandingDemoVideo from "@/components/landing/LandingDemoVideo";
import LandingRoiCalculator from "@/components/landing/LandingRoiCalculator";
import LandingValidatedScenarios from "@/components/landing/LandingValidatedScenarios";
import LandingCompare from "@/components/landing/LandingCompare";
import LandingPortals from "@/components/landing/LandingPortals";
import LandingFaq from "@/components/landing/LandingFaq";
import LandingLeadForm from "@/components/landing/LandingLeadForm";
import LandingChangelog from "@/components/landing/LandingChangelog";
import LandingCta from "@/components/landing/LandingCta";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingJsonLd from "@/components/landing/LandingJsonLd";
import {
  HOME_CTA,
  HOME_FEATURES,
  HOME_FEATURES_SECTION,
  HOME_FAQ,
  HOME_FOOTER_TAGLINE,
  HOME_HOW_IT_WORKS,
  HOME_STEPS,
} from "@/lib/landing/home-content";

type Props = {
  branding: BrandingTokens;
};

/**
 * Home — funil comercial alinhado às páginas de segmento:
 * dor → solução → como funciona → segmentos → recursos → prova → portais.
 */
export default function LandingHomePageView({ branding }: Props) {
  return (
    <>
      <LandingJsonLd branding={branding} />
      <LandingHeader branding={branding} context="home" />
      <main id="conteudo-principal" className="flex-1">
        <LandingHeroProduct />
        <LandingStats />
        <LandingProblem />
        <LandingSolution />
        <LandingHowItWorks steps={HOME_STEPS} section={HOME_HOW_IT_WORKS} />
        <LandingNiches />
        <LandingFeatures
          sectionId="recursos"
          featuresSection={HOME_FEATURES_SECTION}
          features={HOME_FEATURES}
        />
        <LandingHomeAudience />
        <LandingDemoVideo />
        <LandingRoiCalculator />
        <LandingValidatedScenarios />
        <LandingCompare />
        <LandingPortals niche="MEDICAL" branding={branding} />
        <LandingFaq items={HOME_FAQ} />
        <LandingLeadForm />
        <LandingCta branding={branding} niche="MEDICAL" description={HOME_CTA} />
        <LandingChangelog />
      </main>
      <LandingFooter branding={branding} context="home" footerTagline={HOME_FOOTER_TAGLINE} />
    </>
  );
}
