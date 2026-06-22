import { LANDING_FAQ } from "@/lib/landing/content";

export default function LandingFaq() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="border-t border-[var(--border-default)] bg-[var(--surface-card)]"
    >
      <div className="mx-auto max-w-3xl px-6 py-20">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-[var(--brand-primary)]">
            FAQ
          </p>
          <h2
            id="faq-heading"
            className="mt-3 text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl"
          >
            Perguntas frequentes
          </h2>
        </div>

        <dl className="mt-12 space-y-4">
          {LANDING_FAQ.map((item) => (
            <div key={item.question} className="ds-card p-5">
              <dt className="text-base font-semibold text-[var(--text-primary)]">
                {item.question}
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                {item.answer}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
