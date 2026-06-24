import Link from "next/link";
import { Suspense } from "react";
import type { BrandingTokens } from "@/lib/theme/tokens";
import type { LandingNavContext } from "@/lib/landing/navigation";
import {
  landingNavItems,
  SEGMENT_ACCESS_HREF,
} from "@/lib/landing/navigation";
import LandingMobileMenu from "@/components/landing/LandingMobileMenu";
import LandingLogoLink from "@/components/landing/LandingLogoLink";
import { landingCtaClasses } from "@/components/landing/landing-cta";

type Props = {
  branding: BrandingTokens;
  context?: LandingNavContext;
};

export default function LandingHeader({ branding, context = "home" }: Props) {
  const anchors = landingNavItems(context);
  const portalsHref = context === "home" ? SEGMENT_ACCESS_HREF : "#portais";

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-default)]/60 bg-[var(--surface-page)]/80 backdrop-blur-xl">
      <a href="#conteudo-principal" className="ds-skip-link">
        Ir para o conteúdo principal
      </a>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-3.5">
        <LandingLogoLink branding={branding} />

        <nav
          aria-label="Navegação principal"
          className="hidden items-center gap-0.5 rounded-full border border-[var(--border-default)] bg-[var(--surface-card)]/80 p-1 shadow-sm lg:flex"
        >
          {context === "segment" && (
            <Link
              href="/"
              className="rounded-full px-3.5 py-1.5 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--brand-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
            >
              Início
            </Link>
          )}
          {anchors.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-1.5 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--brand-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Suspense fallback={null}>
            <LandingMobileMenu context={context} />
          </Suspense>
          <Link
            href="/beneficiario/login"
            className="hidden rounded-full px-3.5 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:text-[var(--brand-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] sm:inline-flex"
          >
            Entrar
          </Link>
          {portalsHref.startsWith("/") ? (
            <Link href={portalsHref} className={landingCtaClasses("surface", "sm")}>
              <span className="sm:hidden">Portais</span>
              <span className="hidden sm:inline">Acessar portais</span>
            </Link>
          ) : (
            <a href={portalsHref} className={landingCtaClasses("surface", "sm")}>
              <span className="sm:hidden">Portais</span>
              <span className="hidden sm:inline">Acessar portais</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
