import { LANDING_STATS } from "@/lib/landing/content";

export default function LandingStats() {
  return (
    <section aria-label="Indicadores da plataforma" className="relative z-10 -mt-8 px-6 sm:-mt-10">
      <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {LANDING_STATS.map((stat) => (
          <div
            key={stat.label}
            className="landing-glass landing-card-hover rounded-2xl px-6 py-5 text-center shadow-md sm:text-left"
          >
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
