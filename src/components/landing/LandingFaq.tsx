import LandingSectionHeader from "@/components/landing/LandingSectionHeader";
import LandingFaqAccordion from "@/components/landing/LandingFaqAccordion";

export default function LandingFaq() {
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
        <LandingFaqAccordion />
      </div>
    </section>
  );
}
