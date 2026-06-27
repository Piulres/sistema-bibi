import type { BrandingTokens } from "@/lib/theme/tokens";
import type { NicheId } from "@/lib/niche/types";
import { getNicheLandingContent } from "@/lib/niche/landing-content";
import LandingIcon from "@/components/landing/LandingIcon";
import LandingWhatsAppCta from "@/components/landing/LandingWhatsAppCta";
import LandingTrackedCta from "@/components/landing/LandingTrackedCta";

type Props = {
  branding: BrandingTokens;
  niche?: NicheId;
  description?: string;
};

export default function LandingCta({ branding, niche = "MEDICAL", description }: Props) {
  const ctaDescription = description ?? getNicheLandingContent(niche).ctaDescription;

  return (
    <section aria-labelledby="cta-heading" className="mx-auto max-w-6xl px-6 py-24">
      <div className="landing-mesh-hero relative overflow-hidden rounded-3xl px-8 py-14 text-center text-[var(--text-inverse)] shadow-xl sm:px-14 sm:py-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.2) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/80">
            <LandingIcon name="shield" className="h-4 w-4 text-[var(--brand-accent)]" />
            Demonstração disponível
          </p>

          <h2
            id="cta-heading"
            className="mt-6 text-3xl tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-tight"
          >
            <span className="font-light">Pronto para conhecer o </span>
            <span className="font-bold">{branding.displayName}</span>
            <span className="font-light">?</span>
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-lg text-white/75">
            {ctaDescription}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
            <LandingTrackedCta
              href="/interno/login"
              event="cta_demo_click"
              location="cta-footer"
              variant="hero"
              size="lg"
              className="min-w-[12rem]"
            >
              Acessar demonstração
              <LandingIcon name="arrow-right" className="h-5 w-5" />
            </LandingTrackedCta>
            <LandingWhatsAppCta
              variant="hero"
              size="lg"
              location="cta-footer"
              className="min-w-[12rem]"
            />
            <LandingTrackedCta
              href="/api/docs"
              event="cta_demo_click"
              location="cta-footer-api"
              variant="hero-ghost"
              size="lg"
              className="min-w-[12rem]"
            >
              Ver API (Swagger)
            </LandingTrackedCta>
          </div>
        </div>
      </div>
    </section>
  );
}
