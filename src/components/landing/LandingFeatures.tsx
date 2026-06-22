import { LANDING_FEATURES } from "@/lib/landing/content";
import Card from "@/components/ui/Card";
import LandingIcon from "@/components/landing/LandingIcon";
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

export default function LandingFeatures() {
  return (
    <section
      id="recursos"
      aria-labelledby="features-heading"
      className="mx-auto max-w-6xl px-6 py-20"
    >
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-[var(--brand-primary)]">
          Recursos
        </p>
        <h2
          id="features-heading"
          className="mt-3 text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl"
        >
          Tudo que clínicas, hospitais e saúde corporativa precisam
        </h2>
        <p className="mt-4 text-lg text-[var(--text-secondary)]">
          Da operação clínica ao faturamento Pay Per Use — uma plataforma unificada
          com portais segregados e dados conectados em tempo real.
        </p>
      </div>

      <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {LANDING_FEATURES.map((feature) => (
          <li key={feature.id}>
            <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl text-[var(--brand-primary)]"
                style={{ background: "var(--status-brand-bg)" }}
                aria-hidden
              >
                <LandingIcon name={ICON_MAP[feature.id]} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                {feature.description}
              </p>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
