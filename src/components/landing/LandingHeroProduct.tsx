import Link from "next/link";
import type { BrandingTokens } from "@/lib/theme/tokens";
import LandingIcon from "@/components/landing/LandingIcon";
import LandingHeroPreview from "@/components/landing/LandingHeroPreview";
import { HOME_HERO } from "@/lib/landing/home-content";
import { LANDING_TRUST_BADGES } from "@/lib/landing/content";
import { SEGMENT_ACCESS_HREF } from "@/lib/landing/navigation";

type Props = {
  branding?: BrandingTokens;
};

export default function LandingHeroProduct(_props: Props) {
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
            {HOME_HERO.badge}
          </p>

          <h1
            id="hero-heading"
            className="landing-fade-in mt-8 text-4xl tracking-tight text-white sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]"
          >
            <span className="font-light">{HOME_HERO.headline}</span>{" "}
            <span className="font-bold">{HOME_HERO.headlineAccent}</span>
          </h1>

          <p className="landing-fade-in mt-6 max-w-xl text-lg leading-relaxed text-white/80 sm:text-xl">
            {HOME_HERO.description}
          </p>

          <p className="landing-fade-in mt-4 max-w-xl text-sm text-white/55">{HOME_HERO.subline}</p>

          <div className="landing-fade-in mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a
              href="#portais"
              className="group inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--brand-accent)] px-6 py-3.5 text-base font-semibold text-[var(--surface-inverse)] shadow-lg transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              Acessar portais
              <LandingIcon
                name="arrow-right"
                className="h-5 w-5 transition group-hover:translate-x-0.5"
              />
            </a>
            <Link
              href={SEGMENT_ACCESS_HREF}
              className="inline-flex items-center justify-center rounded-[var(--radius-button)] border border-white/20 bg-white/8 px-6 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              Acesso segmentado
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
