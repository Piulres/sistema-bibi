import Link from "next/link";
import type { BrandingTokens } from "@/lib/theme/tokens";
import { buildLandingDescription, LANDING_TRUST_BADGES } from "@/lib/landing/content";
import LandingIcon from "@/components/landing/LandingIcon";

type Props = {
  branding: BrandingTokens;
};

export default function LandingHero({ branding }: Props) {
  const description = buildLandingDescription(branding.tagline);

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden ds-gradient-brand text-[var(--text-inverse)]"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.15) 0%, transparent 45%), radial-gradient(circle at 80% 0%, rgba(20,184,166,0.25) 0%, transparent 40%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28 lg:py-32">
        <p className="landing-fade-in inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90 backdrop-blur-sm">
          <LandingIcon name="shield" className="h-4 w-4" />
          HealthTech · SaaS · Pay Per Use
        </p>

        <h1
          id="hero-heading"
          className="landing-fade-in mt-8 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl lg:leading-[1.1]"
        >
          {branding.displayName}: gestão em saúde sem burocracia
        </h1>

        <p className="landing-fade-in mt-6 max-w-2xl text-lg leading-relaxed text-white/85 sm:text-xl">
          {description}
        </p>

        <p className="landing-fade-in mt-4 max-w-2xl text-sm text-white/65">
          Cada tenant opera com marca própria — logo, cores e domínio — sobre a
          infraestrutura {branding.platformLabel}.
        </p>

        <div className="landing-fade-in mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href="#portais"
            className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--brand-accent)] px-6 py-3.5 text-base font-semibold text-[var(--surface-inverse)] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          >
            Explorar portais
            <LandingIcon name="arrow-right" className="h-5 w-5" />
          </Link>
          <Link
            href="#recursos"
            className="inline-flex items-center justify-center rounded-[var(--radius-button)] border border-white/25 bg-white/10 px-6 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          >
            Ver recursos
          </Link>
        </div>

        <ul
          className="landing-fade-in mt-12 flex flex-wrap gap-2"
          aria-label="Diferenciais da plataforma"
        >
          {LANDING_TRUST_BADGES.map((badge) => (
            <li key={badge}>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
                <LandingIcon name="check" className="h-3.5 w-3.5 text-[var(--brand-accent)]" />
                {badge}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
