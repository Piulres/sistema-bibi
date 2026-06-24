import LandingSectionHeader from "@/components/landing/LandingSectionHeader";
import Card from "@/components/ui/Card";
import { HOME_PRODUCT, HOME_VALUES, HOME_VISION } from "@/lib/landing/home-content";

export function LandingHomeProduct() {
  return (
    <section id="produto" aria-labelledby="produto-heading" className="mx-auto max-w-6xl px-6 py-24">
      <LandingSectionHeader
        id="produto-heading"
        eyebrow="Produto"
        title={HOME_PRODUCT.title}
        description={HOME_PRODUCT.description}
      />
      <ul className="mt-14 grid gap-4 sm:grid-cols-2">
        {HOME_PRODUCT.bullets.map((item) => (
          <li key={item}>
            <Card accent className="h-full">
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{item}</p>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function LandingHomeVision() {
  return (
    <section
      id="visao"
      aria-labelledby="visao-heading"
      className="border-y border-[var(--border-default)] bg-[var(--surface-muted)]/60"
    >
      <div className="mx-auto max-w-6xl px-6 py-24">
        <LandingSectionHeader
          id="visao-heading"
          eyebrow="Visão"
          title={HOME_VISION.title}
          description={HOME_VISION.description}
        />
        <ul className="mt-10 space-y-3">
          {HOME_VISION.bullets.map((item) => (
            <li
              key={item}
              className="rounded-xl border border-[var(--border-default)] border-l-4 border-l-[var(--brand-accent)] bg-[var(--surface-card)] px-5 py-4 text-sm text-[var(--text-secondary)]"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function LandingHomeValues() {
  return (
    <section id="valores" aria-labelledby="valores-heading" className="mx-auto max-w-6xl px-6 py-24">
      <LandingSectionHeader
        id="valores-heading"
        eyebrow="Valores"
        title={HOME_VALUES.title}
        description={HOME_VALUES.description}
      />
      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {HOME_VALUES.bullets.map((item) => (
          <li
            key={item}
            className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] px-5 py-4 text-sm text-[var(--text-secondary)]"
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
