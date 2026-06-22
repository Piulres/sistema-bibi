import Link from "next/link";
import Image from "next/image";
import type { BrandingTokens } from "@/lib/theme/tokens";

type Props = {
  branding: BrandingTokens;
};

const NAV_LINKS = [
  { href: "#recursos", label: "Recursos" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#portais", label: "Portais" },
  { href: "#faq", label: "FAQ" },
] as const;

export default function LandingHeader({ branding }: Props) {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-default)]/80 bg-[var(--surface-page)]/90 backdrop-blur-md">
      <a href="#conteudo-principal" className="ds-skip-link">
        Ir para o conteúdo principal
      </a>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
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
              className="h-10 w-10 rounded-lg object-contain"
              priority
            />
          ) : (
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-[var(--text-inverse)]"
              style={{
                background: `linear-gradient(135deg, var(--brand-hero-from), var(--brand-hero-to))`,
              }}
              aria-hidden
            >
              {branding.displayName.charAt(0)}
            </span>
          )}
          <span className="truncate font-semibold text-[var(--text-primary)]">
            {branding.displayName}
          </span>
        </Link>

        <nav aria-label="Navegação principal" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/beneficiario/login"
            className="hidden rounded-md px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] sm:inline-flex"
          >
            Entrar
          </Link>
          <Link
            href="#portais"
            className="inline-flex items-center justify-center rounded-[var(--radius-button)] bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-[var(--text-inverse)] transition hover:bg-[var(--brand-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] focus-visible:ring-offset-2"
          >
            Acessar portais
          </Link>
        </div>
      </div>
    </header>
  );
}
