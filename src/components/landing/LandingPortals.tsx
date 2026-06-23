import Link from "next/link";
import type { NicheId } from "@/lib/niche/types";
import { getNicheLandingContent } from "@/lib/niche/landing-content";
import { PORTAL_THEMES } from "@/lib/theme/portals";
import LandingIcon from "@/components/landing/LandingIcon";
import LandingSectionHeader from "@/components/landing/LandingSectionHeader";

type Props = {
  niche: NicheId;
  segment?: { tenantSlug?: string | null; niche?: NicheId };
};

export default function LandingPortals({ niche, segment }: Props) {
  const { portals } = getNicheLandingContent(niche, segment);

  return (
    <section
      id="portais"
      aria-labelledby="portals-heading"
      className="mx-auto max-w-6xl px-6 py-24"
    >
      <LandingSectionHeader
        id="portals-heading"
        eyebrow="Portais"
        title="Selecione seu portal de acesso"
        description="Quatro experiências segregadas por perfil — cada uma com autenticação, permissões e interface dedicadas."
      />

      <ul className="mt-14 grid gap-5 sm:grid-cols-2">
        {portals.map((portal) => {
          const theme = PORTAL_THEMES[portal.key];
          return (
            <li key={portal.href}>
              <Link
                href={portal.href}
                className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] focus-visible:ring-offset-2"
              >
                <article className="landing-card-hover relative h-full overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 shadow-sm">
                  <div
                    className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-80"
                    style={{
                      backgroundImage: `linear-gradient(90deg, ${theme.accentFrom}, ${theme.accentTo})`,
                    }}
                    aria-hidden
                  />

                  <div className="flex items-start justify-between gap-4">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-[var(--text-inverse)] shadow-sm"
                      style={{
                        background: `linear-gradient(135deg, ${theme.accentFrom}, ${theme.accentTo})`,
                      }}
                      aria-hidden
                    >
                      <LandingIcon name="portals" className="h-6 w-6" />
                    </div>
                    <span className="rounded-full border border-[var(--border-default)] bg-[var(--surface-muted)] px-2.5 py-1 text-xs font-medium text-[var(--text-muted)]">
                      {portal.audience}
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-semibold text-[var(--text-primary)]">
                    {theme.label}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                    {portal.description}
                  </p>

                  <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--brand-primary)] transition group-hover:gap-2.5">
                    Entrar no portal
                    <LandingIcon name="arrow-right" className="h-4 w-4" />
                  </span>
                </article>
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="mt-10 rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--surface-muted)]/50 px-4 py-3 text-center text-sm text-[var(--text-muted)]">
        Demonstração POC — use a senha{" "}
        <code className="rounded-md bg-[var(--surface-card)] px-1.5 py-0.5 font-mono text-xs text-[var(--text-secondary)]">
          bibi123
        </code>{" "}
        com os e-mails de teste de cada portal.
        {niche !== "MEDICAL" && (
          <>
            {" "}
            Preview deste nicho:{" "}
            <code className="rounded-md bg-[var(--surface-card)] px-1.5 py-0.5 font-mono text-xs text-[var(--text-secondary)]">
              ?niche={niche}
            </code>
          </>
        )}
      </p>
    </section>
  );
}
