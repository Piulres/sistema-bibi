import LandingSectionHeader from "@/components/landing/LandingSectionHeader";
import LandingIcon from "@/components/landing/LandingIcon";

const SOLUTIONS = [
  {
    icon: "pay-per-use" as const,
    title: "Pay Per Use nativo",
    description: "Cada serviço registrado gera snapshot de preço — transparência total para RH, operação e cliente.",
  },
  {
    icon: "portals" as const,
    title: "Quatro portais integrados",
    description: "Prestador, interno, empresa e beneficiário compartilham a mesma base de dados em tempo real.",
  },
  {
    icon: "enterprise" as const,
    title: "Multi-nicho e white label",
    description: "Seis segmentos com labels automáticos, paleta por nicho e Orange como accent universal.",
  },
] as const;

export default function LandingSolution() {
  return (
    <section
      id="solucao"
      aria-labelledby="solution-heading"
      className="border-y border-[var(--border-default)] bg-[var(--surface-muted)]/60"
    >
      <div className="mx-auto max-w-6xl px-6 py-24">
        <LandingSectionHeader
          id="solution-heading"
          eyebrow="A solução"
          title="ServiceOS — infraestrutura horizontal com identidade brasileira"
          description="Dark Slate para confiança, Orange para ação. Uma plataforma que escala de clínicas a escolas sem reinventar o core."
        />

        <ul className="mt-14 grid gap-6 lg:grid-cols-3">
          {SOLUTIONS.map((item) => (
            <li key={item.title}>
              <article className="landing-card-hover h-full rounded-2xl border border-[var(--border-default)] border-l-4 border-l-[var(--brand-accent)] bg-[var(--surface-card)] p-6 shadow-sm">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-accent)] text-[var(--text-inverse)]"
                  aria-hidden
                >
                  <LandingIcon name={item.icon} className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-[var(--text-primary)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {item.description}
                </p>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
