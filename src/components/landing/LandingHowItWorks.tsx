import { LANDING_STEPS } from "@/lib/landing/content";

export default function LandingHowItWorks() {
  return (
    <section
      id="como-funciona"
      aria-labelledby="how-heading"
      className="border-y border-[var(--border-default)] bg-[var(--surface-muted)]"
    >
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-[var(--brand-primary)]">
            Como funciona
          </p>
          <h2
            id="how-heading"
            className="mt-3 text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl"
          >
            Do agendamento ao faturamento em três etapas
          </h2>
          <p className="mt-4 text-lg text-[var(--text-secondary)]">
            Fluxos curtos e integrados — sem telas excessivas, sem perda de
            informação entre operação e financeiro.
          </p>
        </div>

        <ol className="mt-12 grid gap-8 lg:grid-cols-3">
          {LANDING_STEPS.map((item, index) => (
            <li key={item.step} className="relative">
              {index < LANDING_STEPS.length - 1 ? (
                <span
                  className="absolute left-8 top-16 hidden h-px w-[calc(100%-2rem)] bg-[var(--border-muted)] lg:block"
                  aria-hidden
                />
              ) : null}
              <div className="ds-card h-full p-6">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-primary)] text-sm font-bold text-[var(--text-inverse)]"
                  aria-hidden
                >
                  {item.step}
                </span>
                <h3 className="mt-4 text-xl font-semibold text-[var(--text-primary)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {item.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
