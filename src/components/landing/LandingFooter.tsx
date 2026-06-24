import Link from "next/link";
import type { BrandingTokens } from "@/lib/theme/tokens";
import type { NicheId } from "@/lib/niche/types";
import type { LandingNavContext } from "@/lib/landing/navigation";
import { landingNavItems } from "@/lib/landing/navigation";
import { getNicheLandingContent } from "@/lib/niche/landing-content";
import { PORTAL_THEMES } from "@/lib/theme/portals";
import { PORTALS } from "@/lib/roles";

type Props = {
  branding: BrandingTokens;
  context?: LandingNavContext;
  niche?: NicheId;
  footerTagline?: string;
};

export default function LandingFooter({
  branding,
  context = "home",
  niche = "MEDICAL",
  footerTagline,
}: Props) {
  const year = new Date().getFullYear();
  const tagline = footerTagline ?? getNicheLandingContent(niche).footerTagline;
  const navLinks = landingNavItems(context);

  const portalLinks =
    context === "home"
      ? Object.entries(PORTALS).map(([key, portal]) => ({
          href: portal.loginPath,
          label: PORTAL_THEMES[key as keyof typeof PORTALS].label,
        }))
      : getNicheLandingContent(niche).portals.map((portal) => ({
          href: portal.href,
          label: PORTAL_THEMES[portal.key].label,
        }));

  return (
    <footer className="border-t border-[var(--border-default)] bg-[var(--surface-muted)]/80">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <p className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
              {branding.displayName}
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--text-secondary)]">
              {tagline}
            </p>
            <p className="mt-4 text-xs text-[var(--text-muted)]">{branding.platformLabel}</p>
          </div>

          <nav aria-label="Links do rodapé">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Navegação</p>
            <ul className="mt-4 space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="rounded-sm text-sm text-[var(--text-secondary)] transition hover:text-[var(--brand-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
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
              {portalLinks.map((portal) => (
                <li key={portal.href}>
                  <Link
                    href={portal.href}
                    className="rounded-sm text-sm text-[var(--text-secondary)] transition hover:text-[var(--brand-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
                  >
                    {portal.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-[var(--border-default)] pt-6 text-xs text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {branding.displayName}. Demonstração POC do produto.
          </p>
          <p>
            <Link
              href="/interno/login"
              className="rounded-sm underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
            >
              Portal interno
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
