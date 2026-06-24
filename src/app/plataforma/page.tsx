import type { Metadata } from "next";
import Link from "next/link";
import { getPlatformBranding } from "@/lib/theme/branding";
import { PLATFORM } from "@/lib/platform";
import {
  PLATFORM_STRUCTURE,
  SALES_SITE_SECTIONS,
  SEGMENT_LANDING_PAGES,
} from "@/lib/platform/structure";
import { PORTALS } from "@/lib/roles";
import TenantTheme from "@/components/layout/TenantTheme";
import PlatformStructureMap from "@/components/platform/PlatformStructureMap";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import Card from "@/components/ui/Card";

export const metadata: Metadata = {
  title: `Mapa da Plataforma — ${PLATFORM.name}`,
  description:
    "Estrutura completa do Portal Sistema Bibi: landing por segmento, portais Interno, Prestador, Empresa e Beneficiário.",
};

export default async function PlataformaPage() {
  const branding = getPlatformBranding();

  return (
    <TenantTheme branding={branding} className="flex min-h-full flex-col">
      <LandingHeader branding={branding} context="home" />
      <main id="conteudo-principal" className="mx-auto w-full max-w-6xl flex-1 px-6 py-16">
        <div className="mb-12">
          <p className="text-sm font-semibold uppercase tracking-wider text-[var(--brand-accent)]">
            Arquitetura
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-[var(--text-primary)]">
            Mapa da Plataforma
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-[var(--text-secondary)]">
            Visão hierárquica do {PLATFORM.name}: landing pages por segmento e quatro portais
            segregados por perfil de acesso.
          </p>
        </div>

        <PlatformStructureMap
          root={PLATFORM_STRUCTURE}
          title="Portal Sistema Bibi"
          description="Clique nos links para acessar cada área da demonstração."
        />

        <section className="mt-16" aria-labelledby="portais-rapidos">
          <h2 id="portais-rapidos" className="text-xl font-semibold text-[var(--text-primary)]">
            Acesso rápido aos portais
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Object.values(PORTALS).map((portal) => (
              <li key={portal.loginPath}>
                <Card accent className="h-full">
                  <h3 className="font-semibold text-[var(--text-primary)]">{portal.label}</h3>
                  <Link
                    href={portal.loginPath}
                    className="mt-4 inline-flex items-center justify-center rounded-[var(--radius-button)] bg-[var(--brand-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-500"
                  >
                    Entrar
                  </Link>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16" aria-labelledby="segmentos-landing">
          <h2 id="segmentos-landing" className="text-xl font-semibold text-[var(--text-primary)]">
            Landing pages por segmento
          </h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SEGMENT_LANDING_PAGES.map((page) => (
              <li key={page.slug}>
                <Link
                  href={page.href}
                  className="block rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] px-4 py-3 transition hover:border-[var(--brand-accent)] hover:shadow-sm"
                >
                  <span className="font-medium text-[var(--text-primary)]">{page.label}</span>
                  <span className="mt-1 block text-xs text-[var(--text-muted)]">
                    /segmentos/{page.slug}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16 rounded-2xl border border-[var(--border-accent)] bg-[var(--status-brand-bg)]/30 p-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Site para venda do Sistema Bibi
          </h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            Propósitos, público-alvo, missão e proposta de valor — página comercial separada da
            demonstração por segmento.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {SALES_SITE_SECTIONS.map((section) => (
              <li key={section.id}>
                <Link
                  href={`/venda#${section.anchor}`}
                  className="inline-flex rounded-full bg-[var(--brand-accent)] px-3 py-1 text-xs font-semibold text-white hover:bg-orange-500"
                >
                  {section.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/venda"
            className="mt-6 inline-flex items-center justify-center rounded-[var(--radius-button)] bg-[var(--brand-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-primary-hover)]"
          >
            Ver site de venda
          </Link>
        </section>
      </main>
      <LandingFooter branding={branding} niche="MEDICAL" />
    </TenantTheme>
  );
}
