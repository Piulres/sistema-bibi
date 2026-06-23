import type { NicheId } from "@/lib/niche/types";
import { getNicheLandingContent } from "@/lib/niche/landing-content";
import LandingSectionHeader from "@/components/landing/LandingSectionHeader";

type Props = {
  niche: NicheId;
};

export default function LandingHowItWorks({ niche }: Props) {
  const { steps } = getNicheLandingContent(niche);

  return (
    <section
      id="como-funciona"
      aria-labelledby="how-heading"
      className="border-y border-[var(--border-default)] bg-[var(--surface-muted)]/60"
    >
      <div className="mx-auto max-w-6xl px-6 py-24">
        <LandingSectionHeader
          id="how-heading"
          eyebrow="Como funciona"
          title="Do agendamento ao faturamento em três etapas"
          description="Fluxos curtos e integrados — sem telas excessivas, sem perda de informação entre operação e financeiro."
        />

        <ol className="relative mt-14 grid gap-6 lg:grid-cols-3 lg:gap-8">
          <div
            className="pointer-events-none absolute left-[calc(16.67%-1px)] right-[calc(16.67%-1px)] top-10 hidden h-0.5 bg-gradient-to-r from-[var(--brand-primary)] via-[var(--brand-accent)] to-[var(--brand-primary)] opacity-30 lg:block"
            aria-hidden
          />

          {steps.map((item) => (
            <li key={item.step} className="relative">
              <article className="landing-card-hover h-full rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 shadow-sm">
                <span
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-accent)] text-sm font-bold text-[var(--text-inverse)] shadow-sm"
                  aria-hidden
                >
                  {item.step}
                </span>
                <h3 className="mt-5 text-xl font-semibold text-[var(--text-primary)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {item.description}
                </p>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
