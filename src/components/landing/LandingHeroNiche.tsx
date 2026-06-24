import type { NicheId } from "@/lib/niche/types";
import { getNicheConfig } from "@/lib/niche/defaults";
import type { BrandingTokens } from "@/lib/theme/tokens";
import LandingIcon from "@/components/landing/LandingIcon";
import LandingHeroPreview from "@/components/landing/LandingHeroPreview";
import { LANDING_TRUST_BADGES } from "@/lib/landing/content";
import Link from "next/link";

type Props = {
  niche: NicheId;
  branding: BrandingTokens;
};

export default function LandingHeroNiche({ niche, branding }: Props) {
  const config = getNicheConfig(niche);
  const { landing } = config;

  return (
    <section
      aria-labelledby="hero-heading"
      className="landing-mesh-hero relative overflow-hidden text-[var(--text-inverse)]"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.15]"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.15) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-16 sm:pb-20 sm:pt-20 lg:grid lg:grid-cols-2 lg:items-center lg:gap-12 lg:pb-24 lg:pt-24">
        <div>
          <p className="landing-fade-in inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90 backdrop-blur-sm">
            <LandingIcon name="shield" className="h-4 w-4 text-[var(--brand-accent)]" />
            {landing.badge}
          </p>

          <h1
            id="hero-heading"
            className="landing-fade-in mt-8 text-4xl tracking-tight text-white sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]"
          >
            <span className="font-light">{landing.headline}</span>{" "}
            <span className="font-bold">{landing.headlineAccent}</span>
          </h1>

          <p className="landing-fade-in mt-6 max-w-xl text-lg leading-relaxed text-white/80 sm:text-xl">
            {landing.description}
          </p>

          <p className="landing-fade-in mt-4 max-w-xl text-sm text-white/55">
            Cada operação usa marca própria — logo, cores e domínio — sobre a
            infraestrutura ServiceOS {branding.displayName}.
          </p>

          <div className="landing-fade-in mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="#portais"
              className="landing-btn-primary-hero group px-6 py-3.5 text-base"
            >
              Explorar portais
              <LandingIcon
                name="arrow-right"
                className="h-5 w-5 transition group-hover:translate-x-0.5"
              />
            </Link>
            <Link
              href="#recursos"
              className="landing-btn-secondary-hero px-6 py-3.5 text-base"
            >
              Ver recursos
            </Link>
          </div>

          <ul
            className="landing-fade-in mt-10 flex flex-wrap gap-2"
            aria-label="Diferenciais da plataforma"
          >
            {LANDING_TRUST_BADGES.map((badge) => (
              <li key={badge}>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/5 px-3 py-1 text-xs font-medium text-white/75">
                  <LandingIcon name="check" className="h-3.5 w-3.5 text-[var(--brand-accent)]" />
                  {badge}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="landing-fade-in mt-14 lg:mt-0">
          <LandingHeroPreview />
        </div>
      </div>
    </section>
  );
}
