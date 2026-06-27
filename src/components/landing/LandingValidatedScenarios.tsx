import LandingSectionHeader from "@/components/landing/LandingSectionHeader";
import Badge from "@/components/ui/Badge";
import { VALIDATED_SCENARIOS } from "@/lib/landing/scenarios-content";

export default function LandingValidatedScenarios() {
  return (
    <section
      id="cenarios"
      aria-labelledby="cenarios-heading"
      className="mx-auto max-w-6xl px-6 py-24"
    >
      <LandingSectionHeader
        id="cenarios-heading"
        eyebrow="Cenários validados"
        title="Fluxos demonstráveis na POC"
        description="Não são depoimentos de clientes em produção — são narrativas dos tenants demo (TechCorp, PetCare, Lex) validadas no produto."
      />

      <ul className="mt-14 grid gap-6 lg:grid-cols-3">
        {VALIDATED_SCENARIOS.map((item) => (
          <li key={item.id}>
            <article className="flex h-full flex-col rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="neutral">{item.segment}</Badge>
                <span className="text-xs text-[var(--text-muted)]">Demo POC</span>
              </div>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                &ldquo;{item.quote}&rdquo;
              </p>
              <footer className="mt-6 border-t border-[var(--border-default)] pt-4">
                <p className="text-sm font-medium text-[var(--text-primary)]">{item.persona}</p>
                <p className="mt-1 text-xs font-semibold text-[var(--brand-accent)]">
                  {item.metric}
                </p>
              </footer>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
