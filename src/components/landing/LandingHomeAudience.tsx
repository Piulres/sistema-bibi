import LandingSectionHeader from "@/components/landing/LandingSectionHeader";
import Card from "@/components/ui/Card";
import { HOME_AUDIENCE } from "@/lib/landing/home-content";

export default function LandingHomeAudience() {
  return (
    <section
      id="para-quem"
      aria-labelledby="para-quem-heading"
      className="border-y border-[var(--border-default)] bg-[var(--surface-muted)]/40"
    >
      <div className="mx-auto max-w-6xl px-6 py-24">
        <LandingSectionHeader
          id="para-quem-heading"
          eyebrow="Para quem"
          title={HOME_AUDIENCE.title}
          description={HOME_AUDIENCE.description}
        />

        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              {HOME_AUDIENCE.purpose.title}
            </h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {HOME_AUDIENCE.purpose.description}
            </p>
            <ul className="mt-6 space-y-3">
              {HOME_AUDIENCE.purpose.bullets.map((item) => (
                <li
                  key={item}
                  className="rounded-xl border border-[var(--border-default)] border-l-4 border-l-[var(--brand-primary)] bg-[var(--surface-card)] px-5 py-4 text-sm text-[var(--text-secondary)]"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              {HOME_AUDIENCE.audience.title}
            </h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {HOME_AUDIENCE.audience.description}
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {HOME_AUDIENCE.audience.bullets.map((item) => (
                <li key={item}>
                  <Card accent className="h-full">
                    <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{item}</p>
                  </Card>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
