import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import type { BrandingTokens } from "@/lib/theme/tokens";
import LandingMobileMenu from "@/components/landing/LandingMobileMenu";

type Props = {
  branding: BrandingTokens;
};

const NAV_LINKS = [
  { href: "#recursos", label: "Recursos" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#portais", label: "Portais" },
  { href: "#faq", label: "FAQ" },
] as const;

const PLATFORM_LINKS = [
  { href: "/plataforma", label: "Plataforma" },
  { href: "/venda", label: "Venda" },
] as const;

export default function LandingHeader({ branding }: Props) {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-default)]/60 bg-[var(--surface-page)]/80 backdrop-blur-xl">
      <a href="#conteudo-principal" className="ds-skip-link">
        Ir para o conteúdo principal
      </a>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-3.5">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] focus-visible:ring-offset-2"
          aria-label={`${branding.displayName} — página inicial`}
        >
          {branding.logoUrl ? (
            <Image
              src={branding.logoUrl}
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 rounded-xl object-contain"
              priority
            />
          ) : (
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-[var(--text-inverse)] shadow-sm"
              style={{
                background: `linear-gradient(135deg, var(--brand-hero-from), var(--brand-hero-to))`,
              }}
              aria-hidden
            >
              {branding.displayName.charAt(0)}
            </span>
          )}
          <span className="truncate text-base font-semibold tracking-tight text-[var(--text-primary)]">
            {branding.displayName}
          </span>
        </Link>

        <nav
          aria-label="Navegação principal"
          className="hidden items-center gap-0.5 rounded-full border border-[var(--border-default)] bg-[var(--surface-card)]/80 p-1 shadow-sm md:flex"
        >
          {PLATFORM_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-1.5 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--brand-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
            >
              {link.label}
            </Link>
          ))}
          {NAV_LINKS.map((link) => (
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
            <LandingMobileMenu />
          </Suspense>
          <Link
            href="/beneficiario/login"
            className="hidden rounded-full px-3.5 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:text-[var(--brand-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] sm:inline-flex"
          >
            Entrar
          </Link>
          <Link
            href="#portais"
            className="inline-flex items-center justify-center rounded-full bg-[var(--brand-primary)] px-3 py-2 text-xs font-semibold text-[var(--text-inverse)] shadow-sm transition hover:bg-[var(--brand-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] focus-visible:ring-offset-2 sm:px-4 sm:text-sm"
          >
            <span className="sm:hidden">Portais</span>
            <span className="hidden sm:inline">Acessar portais</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
