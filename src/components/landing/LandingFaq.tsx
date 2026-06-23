import type { NicheId } from "@/lib/niche/types";
import { getNicheLandingContent } from "@/lib/niche/landing-content";
import LandingSectionHeader from "@/components/landing/LandingSectionHeader";
import LandingFaqAccordion from "@/components/landing/LandingFaqAccordion";

type Props = {
  niche: NicheId;
};

export default function LandingFaq({ niche }: Props) {
  const { faq } = getNicheLandingContent(niche);

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="border-t border-[var(--border-default)] bg-[var(--surface-card)]"
    >
      <div className="mx-auto max-w-3xl px-6 py-24">
        <LandingSectionHeader
          id="faq-heading"
          eyebrow="FAQ"
          title="Perguntas frequentes"
          align="center"
        />
        <LandingFaqAccordion items={faq} />
      </div>
    </section>
  );
}
