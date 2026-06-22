import Link from "next/link";
import type { BrandingTokens } from "@/lib/theme/tokens";

type Props = {
  branding: BrandingTokens;
};

const FOOTER_LINKS: { href: string; label: string; external?: boolean }[] = [
  { href: "#recursos", label: "Recursos" },
  { href: "#portais", label: "Portais" },
  { href: "/api-docs.html", label: "Documentação API", external: true },
];

export default function LandingFooter({ branding }: Props) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border-default)] bg-[var(--surface-muted)]">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-semibold text-[var(--text-primary)]">
              {branding.displayName}
            </p>
            <p className="mt-2 max-w-sm text-sm text-[var(--text-secondary)]">
              SaaS HealthTech para clínicas e operadoras — Pay Per Use, operação
              clínica e faturamento integrado.
            </p>
            <p className="mt-3 text-xs text-[var(--text-muted)]">
              {branding.platformLabel}
            </p>
          </div>

          <nav aria-label="Links do rodapé">
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    {...(link.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] rounded-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-[var(--border-default)] pt-6 text-xs text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between">
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
