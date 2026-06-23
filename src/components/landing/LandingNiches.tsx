import { NICHE_PRESETS_ENERGIA_BRASILEIRA } from "@/lib/theme/presets-energia-brasileira";
import { NICHE_CONFIGS } from "@/lib/niche/defaults";
import type { NicheId } from "@/lib/niche/types";
import LandingSectionHeader from "@/components/landing/LandingSectionHeader";

const NICHE_IDS = Object.keys(NICHE_CONFIGS) as NicheId[];

export default function LandingNiches() {
  return (
    <section
      id="nichos"
      aria-labelledby="niches-heading"
      className="border-t border-[var(--border-default)] bg-[var(--surface-muted)]/40"
    >
      <div className="mx-auto max-w-6xl px-6 py-24">
        <LandingSectionHeader
          id="niches-heading"
          eyebrow="Multi-nicho"
          title="Seis segmentos, uma identidade coesa"
          description="Cada nicho tem cor primária própria — Orange (#f97316) permanece como accent universal em CTAs e destaques."
        />

        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {NICHE_IDS.map((id) => {
            const preset = NICHE_PRESETS_ENERGIA_BRASILEIRA[id];
            const config = NICHE_CONFIGS[id];
            return (
              <li key={id}>
                <article className="landing-card-hover h-full overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm">
                  <div
                    className="h-2"
                    style={{
                      background: `linear-gradient(90deg, ${preset.primaryColor}, ${preset.accentColor})`,
                    }}
                    aria-hidden
                  />
                  <div className="p-5">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white"
                        style={{ backgroundColor: preset.primaryColor }}
                        aria-hidden
                      >
                        {preset.label.charAt(0)}
                      </span>
                      <div>
                        <h3 className="font-semibold text-[var(--text-primary)]">{config.name}</h3>
                        <p className="text-xs text-[var(--text-muted)]">{id}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-[var(--text-secondary)]">{config.tagline}</p>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
