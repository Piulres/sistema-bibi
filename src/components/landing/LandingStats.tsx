import { LANDING_STATS } from "@/lib/landing/content";

export default function LandingStats() {
  return (
    <section aria-label="Indicadores da plataforma" className="border-b border-[var(--border-default)] bg-[var(--surface-card)]">
      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
        {LANDING_STATS.map((stat) => (
          <div key={stat.label} className="text-center sm:text-left">
            <p className="text-2xl font-bold tracking-tight text-[var(--brand-primary)] sm:text-3xl">
              {stat.value}
              {stat.suffix}
            </p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
