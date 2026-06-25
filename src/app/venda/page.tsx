import type { Metadata } from "next";
import Link from "next/link";
import { getPlatformBranding } from "@/lib/theme/branding";
import { PLATFORM } from "@/lib/platform";
import { buildLandingMetadata } from "@/lib/landing/metadata";
import { SALES_SITE_SECTIONS } from "@/lib/platform/structure";
import TenantTheme from "@/components/layout/TenantTheme";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingCta from "@/components/landing/LandingCta";
import LandingJsonLd from "@/components/landing/LandingJsonLd";

const VENDA_DESCRIPTION =
  "Propósitos, público-alvo, missão e valor do Sistema Bibi - ServiceOS — infraestrutura Pay Per Use multi-nicho.";

export const metadata: Metadata = buildLandingMetadata({
  title: `Proposta comercial — ${PLATFORM.name}`,
  description: VENDA_DESCRIPTION,
  canonicalPath: "/venda",
  keywords: ["serviceos", "proposta", "pay per use", "b2b", "sistema bibi"],
});

export default async function VendaPage() {
  const branding = getPlatformBranding();

  return (
    <TenantTheme branding={branding} className="flex min-h-full flex-col">
      <LandingJsonLd branding={branding} />
      <LandingHeader branding={branding} context="home" />
      <main id="conteudo-principal" className="flex-1">
        <section className="landing-mesh-hero px-6 py-20 text-[var(--text-inverse)]">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-white/70">
              Site para venda
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              {PLATFORM.name}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80">
              Infraestrutura horizontal Pay Per Use para operações de serviços profissionais —
              do consultório à corporação.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {SALES_SITE_SECTIONS.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.anchor}`}
                  className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/15"
                >
                  {section.label}
                </a>
              ))}
            </div>
          </div>
        </section>

        {SALES_SITE_SECTIONS.map((section, index) => (
          <section
            key={section.id}
            id={section.anchor}
            aria-labelledby={`${section.id}-heading`}
            className={index % 2 === 0 ? "bg-[var(--surface-page)]" : "bg-[var(--surface-muted)]/50"}
          >
            <div className="mx-auto max-w-4xl px-6 py-20">
              <p className="text-sm font-semibold uppercase tracking-wider text-[var(--brand-accent)]">
                {section.label}
              </p>
              <h2
                id={`${section.id}-heading`}
                className="mt-2 text-3xl font-bold text-[var(--text-primary)]"
              >
                {section.title}
              </h2>
              <p className="mt-4 text-lg text-[var(--text-secondary)]">{section.description}</p>
              <ul className="mt-8 space-y-3">
                {section.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="flex items-start gap-3 rounded-xl border border-[var(--border-default)] border-l-4 border-l-[var(--brand-accent)] bg-[var(--surface-card)] px-5 py-4"
                  >
                    <span
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--brand-accent)]"
                      aria-hidden
                    />
                    <span className="text-[var(--text-secondary)]">{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}

        <div className="mx-auto max-w-6xl px-6 pb-8">
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-8 text-center">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Explore a estrutura completa
            </h2>
            <p className="mt-2 text-[var(--text-secondary)]">
              Veja o mapa hierárquico com landing pages, portais e perfis de acesso.
            </p>
            <Link
              href="/plataforma"
              className="mt-6 inline-flex items-center justify-center rounded-[var(--radius-button)] bg-[var(--brand-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-primary-hover)]"
            >
              Mapa da plataforma
            </Link>
          </div>
        </div>

        <LandingCta branding={branding} niche="MEDICAL" />
      </main>
      <LandingFooter branding={branding} niche="MEDICAL" />
    </TenantTheme>
  );
}
