import type { NicheId } from "@/lib/niche/types";
import { getNicheLandingContent } from "@/lib/niche/landing-content";
import LandingIcon from "@/components/landing/LandingIcon";
import LandingSectionHeader from "@/components/landing/LandingSectionHeader";
import type { ComponentProps } from "react";
import type { LandingFeature } from "@/lib/niche/landing-content";

const ICON_MAP: Record<LandingFeature["id"], ComponentProps<typeof LandingIcon>["name"]> = {
  "pay-per-use": "pay-per-use",
  pricing: "pricing",
  portals: "portals",
  operations: "pep",
  billing: "billing",
  enterprise: "enterprise",
};

const BENTO_SPANS: Record<LandingFeature["id"], string> = {
  "pay-per-use": "sm:col-span-2",
  pricing: "",
  portals: "",
  operations: "",
  billing: "",
  enterprise: "sm:col-span-2",
};

type Props = {
  niche: NicheId;
};

export default function LandingFeatures({ niche }: Props) {
  const { featuresSection, features } = getNicheLandingContent(niche);

  return (
    <section
      id="recursos"
      aria-labelledby="features-heading"
      className="relative mx-auto max-w-6xl px-6 py-24"
    >
      <div className="landing-grid-pattern pointer-events-none absolute inset-x-0 top-12 h-64 opacity-60" aria-hidden />

      <LandingSectionHeader
        id="features-heading"
        eyebrow="Recursos"
        title={featuresSection.title}
        description={featuresSection.description}
      />

      <ul className="relative mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <li key={feature.id} className={BENTO_SPANS[feature.id]}>
            <article className="landing-card-hover group h-full rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 shadow-sm">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-accent)] text-[var(--text-inverse)] shadow-sm transition group-hover:scale-105 motion-reduce:transform-none"
                aria-hidden
              >
                <LandingIcon name={ICON_MAP[feature.id]} className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-[var(--text-primary)]">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                {feature.description}
              </p>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
