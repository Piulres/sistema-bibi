import Link from "next/link";
import type { BrandingTokens } from "@/lib/theme/tokens";

type Props = {
  branding: BrandingTokens;
};

export default function LandingCta({ branding }: Props) {
  return (
    <section
      aria-labelledby="cta-heading"
      className="mx-auto max-w-6xl px-6 py-20"
    >
      <div className="ds-gradient-brand relative overflow-hidden rounded-2xl px-8 py-12 text-center text-[var(--text-inverse)] sm:px-12 sm:py-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(circle at 0% 100%, rgba(20,184,166,0.4) 0%, transparent 50%)",
          }}
        />
        <div className="relative">
          <h2 id="cta-heading" className="text-3xl font-bold tracking-tight sm:text-4xl">
            Pronto para conhecer o {branding.displayName}?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
            Explore a demonstração com os quatro portais, fluxo Pay Per Use
            e white label configurável para cada clínica cliente.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/interno/login"
              className="inline-flex min-w-[12rem] items-center justify-center rounded-[var(--radius-button)] bg-[var(--brand-accent)] px-6 py-3.5 text-base font-semibold text-[var(--surface-inverse)] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              Acessar demonstração
            </Link>
            <a
              href="/openapi.yaml"
              className="inline-flex min-w-[12rem] items-center justify-center rounded-[var(--radius-button)] border border-white/25 bg-white/10 px-6 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              Ver API (OpenAPI)
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
