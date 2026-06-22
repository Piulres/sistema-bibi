import Link from "next/link";
import type { BrandingTokens } from "@/lib/theme/tokens";
import LandingIcon from "@/components/landing/LandingIcon";

type Props = {
  branding: BrandingTokens;
};

export default function LandingCta({ branding }: Props) {
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
            className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-tight"
          >
            Pronto para conhecer o{" "}
            <span className="landing-gradient-text">{branding.displayName}</span>?
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-lg text-white/75">
            Explore a demonstração com os quatro portais, fluxo Pay Per Use e white
            label configurável para cada clínica cliente.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/interno/login"
              className="inline-flex min-w-[12rem] items-center justify-center gap-2 rounded-full bg-[var(--brand-accent)] px-7 py-3.5 text-base font-semibold text-[var(--surface-inverse)] shadow-lg shadow-teal-900/25 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              Acessar demonstração
              <LandingIcon name="arrow-right" className="h-5 w-5" />
            </Link>
            <a
              href="/openapi.yaml"
              className="inline-flex min-w-[12rem] items-center justify-center rounded-full border border-white/20 bg-white/8 px-7 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              Ver API (OpenAPI)
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
