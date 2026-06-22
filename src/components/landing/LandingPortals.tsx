import Link from "next/link";
import { LANDING_PORTALS } from "@/lib/landing/content";
import { PORTAL_THEMES } from "@/lib/theme/portals";
import Card from "@/components/ui/Card";
import LandingIcon from "@/components/landing/LandingIcon";

export default function LandingPortals() {
  return (
    <section
      id="portais"
      aria-labelledby="portals-heading"
      className="mx-auto max-w-6xl px-6 py-20"
    >
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-[var(--brand-primary)]">
          Portais
        </p>
        <h2
          id="portals-heading"
          className="mt-3 text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl"
        >
          Selecione seu portal de acesso
        </h2>
        <p className="mt-4 text-lg text-[var(--text-secondary)]">
          Quatro experiências segregadas por perfil — cada uma com autenticação,
          permissões e interface dedicadas.
        </p>
      </div>

      <ul className="mt-12 grid gap-5 sm:grid-cols-2">
        {LANDING_PORTALS.map((portal) => {
          const theme = PORTAL_THEMES[portal.key];
          return (
            <li key={portal.href}>
              <Link
                href={portal.href}
                className="group block h-full rounded-[var(--radius-card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] focus-visible:ring-offset-2"
              >
                <Card className="h-full transition group-hover:-translate-y-1 group-hover:shadow-md motion-reduce:transform-none">
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-[var(--text-inverse)]"
                      style={{
                        background: `linear-gradient(135deg, ${theme.accentFrom}, ${theme.accentTo})`,
                      }}
                      aria-hidden
                    >
                      <LandingIcon name="portals" className="h-6 w-6" />
                    </div>
                    <span className="rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-xs font-medium text-[var(--text-muted)]">
                      {portal.audience}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">
                    {theme.label}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                    {portal.description}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--brand-primary)] group-hover:underline">
                    Entrar no portal
                    <LandingIcon name="arrow-right" className="h-4 w-4" />
                  </span>
                </Card>
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="mt-8 text-center text-sm text-[var(--text-muted)]">
        Demonstração POC — use a senha{" "}
        <code className="rounded bg-[var(--surface-muted)] px-1.5 py-0.5 font-mono text-xs">
          bibi123
        </code>{" "}
        com os e-mails de teste de cada portal.
      </p>
    </section>
  );
}
