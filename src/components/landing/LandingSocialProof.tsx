import { SEGMENT_LANDING_PAGES } from "@/lib/platform/structure";
import LandingIcon from "@/components/landing/LandingIcon";

const PROOF_ITEMS = [
  {
    icon: "portals" as const,
    value: "4 portais",
    label: "demonstração integrada ao vivo",
  },
  {
    icon: "pay-per-use" as const,
    value: "6 segmentos",
    label: "com tenant demo e white label",
  },
  {
    icon: "enterprise" as const,
    value: "POC validada",
    label: "fluxos E2E documentados",
  },
] as const;

export default function LandingSocialProof() {
  return (
    <section
      aria-labelledby="proof-heading"
      className="border-b border-[var(--border-default)] bg-[var(--surface-page)]"
    >
      <div className="mx-auto max-w-6xl px-6 py-12">
        <h2 id="proof-heading" className="sr-only">
          Prova da plataforma
        </h2>
        <ul className="grid gap-6 sm:grid-cols-3">
          {PROOF_ITEMS.map((item) => (
            <li
              key={item.value}
              className="flex items-center gap-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] px-5 py-4"
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]"
                aria-hidden
              >
                <LandingIcon name={item.icon} className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-[var(--text-primary)]">{item.value}</p>
                <p className="text-sm text-[var(--text-muted)]">{item.label}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
          Explore demos segmentadas:{" "}
          {SEGMENT_LANDING_PAGES.map((page, index) => (
            <span key={page.slug}>
              {index > 0 ? " · " : null}
              <a
                href={page.href}
                className="font-medium text-[var(--brand-accent)] underline-offset-2 hover:underline"
              >
                {page.label.replace("Página ", "")}
              </a>
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
