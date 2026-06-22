import { LANDING_FEATURES } from "@/lib/landing/content";
import LandingIcon from "@/components/landing/LandingIcon";
import LandingSectionHeader from "@/components/landing/LandingSectionHeader";
import type { ComponentProps } from "react";

const ICON_MAP: Record<
  (typeof LANDING_FEATURES)[number]["id"],
  ComponentProps<typeof LandingIcon>["name"]
> = {
  "pay-per-use": "pay-per-use",
  pricing: "pricing",
  portals: "portals",
  pep: "pep",
  billing: "billing",
  enterprise: "enterprise",
};

const BENTO_SPANS: Record<(typeof LANDING_FEATURES)[number]["id"], string> = {
  "pay-per-use": "sm:col-span-2",
  pricing: "",
  portals: "",
  pep: "",
  billing: "",
  enterprise: "sm:col-span-2",
};

export default function LandingFeatures() {
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
        title="Tudo que clínicas, hospitais e saúde corporativa precisam"
        description="Da operação clínica ao faturamento Pay Per Use — uma plataforma unificada com portais segregados e dados conectados em tempo real."
      />

      <ul className="relative mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LANDING_FEATURES.map((feature) => (
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
