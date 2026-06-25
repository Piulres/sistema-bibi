import { SEGMENT_COLORS, segmentGradient, segmentGradientDiagonal } from "@/lib/theme/segment-colors";
import { NICHE_CONFIGS } from "@/lib/niche/defaults";
import { segmentLandingHref } from "@/lib/platform/structure";
import type { NicheId } from "@/lib/niche/types";
import LandingSectionHeader from "@/components/landing/LandingSectionHeader";
import Link from "next/link";

const NICHE_IDS = Object.keys(NICHE_CONFIGS) as NicheId[];

export default function LandingNiches() {
  return (
    <section
      id="segmentos"
      aria-labelledby="niches-heading"
      className="border-t border-[var(--border-default)] bg-[var(--surface-muted)]/40"
    >
      <div className="mx-auto max-w-6xl px-6 py-24">
        <LandingSectionHeader
          id="niches-heading"
          eyebrow="Multi-nicho"
        title="Seis segmentos, uma infraestrutura"
        description="Cada vertical tem página dedicada com demonstração segmentada — labels, cores e portais pré-configurados para o tenant demo."
        />

        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {NICHE_IDS.map((id) => {
            const preset = SEGMENT_COLORS[id];
            const config = NICHE_CONFIGS[id];
            return (
              <li key={id}>
                <Link
                  href={segmentLandingHref(id)}
                  className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
                >
                <article className="landing-card-hover h-full overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm">
                  <div
                    className="h-2"
                    style={{ background: segmentGradient(id) }}
                    aria-hidden
                  />
                  <div className="p-5">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white"
                        style={{ background: segmentGradientDiagonal(id) }}
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
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
