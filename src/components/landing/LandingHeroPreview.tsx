import LandingIcon from "@/components/landing/LandingIcon";

const MINI_STATS = [
  { label: "Consultas hoje", value: "24" },
  { label: "Faturamento", value: "R$ 12,4k" },
  { label: "Pay Per Use", value: "98%" },
] as const;

const MINI_PORTALS = [
  { label: "Prestador", tone: "from-indigo-500 to-violet-600" },
  { label: "Interno", tone: "from-teal-500 to-emerald-600" },
  { label: "PJ", tone: "from-amber-500 to-orange-600" },
  { label: "Beneficiário", tone: "from-sky-500 to-blue-600" },
] as const;

export default function LandingHeroPreview() {
  return (
    <div
      className="landing-float relative mx-auto w-full max-w-lg lg:max-w-none"
      aria-hidden
    >
      <div className="landing-glass-dark absolute -left-4 top-8 z-10 hidden rounded-xl px-4 py-3 shadow-lg sm:block landing-float-delayed">
        <p className="text-xs font-medium text-white/60">Status</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-white">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Operação em tempo real
        </p>
      </div>

      <div className="landing-glass-dark overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/30">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          <span className="ml-2 text-xs text-white/40">sistema-bibi.app</span>
        </div>

        <div className="space-y-4 p-5">
          <div className="grid grid-cols-3 gap-3">
            {MINI_STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5"
              >
                <p className="text-[10px] font-medium uppercase tracking-wide text-white/50">
                  {stat.label}
                </p>
                <p className="mt-1 text-sm font-bold text-white">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-white/70">Portais ativos</p>
              <LandingIcon name="portals" className="h-4 w-4 text-[var(--brand-accent)]" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {MINI_PORTALS.map((portal) => (
                <div
                  key={portal.label}
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2"
                >
                  <span
                    className={`h-6 w-6 shrink-0 rounded-md bg-gradient-to-br ${portal.tone}`}
                  />
                  <span className="truncate text-xs font-medium text-white/80">
                    {portal.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-[var(--brand-accent)]/30 bg-[var(--brand-accent)]/10 px-4 py-3">
            <LandingIcon name="pay-per-use" className="h-5 w-5 text-[var(--brand-accent)]" />
            <div>
              <p className="text-xs font-semibold text-white">Pay Per Use</p>
              <p className="text-[11px] text-white/60">Preço congelado no atendimento</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
