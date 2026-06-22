import Link from "next/link";
import type { BrandingTokens } from "@/lib/theme/tokens";
import { LANDING_PORTALS } from "@/lib/landing/content";
import { PORTAL_THEMES } from "@/lib/theme/portals";

type Props = {
  branding: BrandingTokens;
};

const FOOTER_LINKS: { href: string; label: string; external?: boolean }[] = [
  { href: "#recursos", label: "Recursos" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#faq", label: "FAQ" },
  { href: "/api-docs.html", label: "Documentação API", external: true },
];

export default function LandingFooter({ branding }: Props) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border-default)] bg-[var(--surface-muted)]/80">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <p className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
              {branding.displayName}
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--text-secondary)]">
              SaaS HealthTech para clínicas e operadoras — Pay Per Use, operação
              clínica e faturamento integrado.
            </p>
            <p className="mt-4 text-xs text-[var(--text-muted)]">
              {branding.platformLabel}
            </p>
          </div>

          <nav aria-label="Links do rodapé">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Navegação</p>
            <ul className="mt-4 space-y-2">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    {...(link.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="text-sm text-[var(--text-secondary)] transition hover:text-[var(--brand-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] rounded-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Portais de acesso">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Portais</p>
            <ul className="mt-4 space-y-2">
              {LANDING_PORTALS.map((portal) => (
                <li key={portal.href}>
                  <Link
                    href={portal.href}
                    className="text-sm text-[var(--text-secondary)] transition hover:text-[var(--brand-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] rounded-sm"
                  >
                    {PORTAL_THEMES[portal.key].label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-[var(--border-default)] pt-6 text-xs text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {branding.displayName}. Demonstração POC do produto.</p>
          <p>
            <Link
              href="/interno/login"
              className="underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] rounded-sm"
            >
              Portal interno
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
