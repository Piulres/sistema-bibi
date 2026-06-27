import LandingIcon from "@/components/landing/LandingIcon";
import LandingHeroPreview from "@/components/landing/LandingHeroPreview";
import { HOME_HERO } from "@/lib/landing/home-content";
import { LANDING_TRUST_BADGES } from "@/lib/landing/content";
import { landingCtaClasses } from "@/components/landing/landing-cta";
import LandingWhatsAppCta from "@/components/landing/LandingWhatsAppCta";
import LandingTrackedCta from "@/components/landing/LandingTrackedCta";

export default function LandingHeroProduct() {
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

          <div
            className="landing-fade-in mt-8 inline-flex flex-col gap-1 rounded-2xl border border-[var(--brand-accent)]/30 bg-[var(--brand-accent)]/10 px-5 py-4 sm:flex-row sm:items-center sm:gap-4"
            role="note"
          >
            <p className="text-2xl font-bold tracking-tight text-[var(--brand-accent)]">
              {HOME_HERO.roiHighlight}
            </p>
            <p className="text-sm text-white/70">{HOME_HERO.roiDetail}</p>
          </div>

          <div className="landing-fade-in mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <LandingTrackedCta
              href="#portais"
              event="cta_portals_click"
              location="hero-home"
              variant="hero"
              size="lg"
              className="group"
            >
              Ver demonstração ao vivo
              <LandingIcon
                name="arrow-right"
                className="h-5 w-5 transition group-hover:translate-x-0.5"
              />
            </LandingTrackedCta>
            <LandingWhatsAppCta variant="hero-ghost" size="lg" location="hero-home" />
            <a href="#segmentos" className={landingCtaClasses("hero-ghost", "lg")}>
              Escolher meu segmento
            </a>
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
