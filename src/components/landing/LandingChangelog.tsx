"use client";

import { useId, useState } from "react";
import LandingSectionHeader from "@/components/landing/LandingSectionHeader";
import Badge from "@/components/ui/Badge";
import {
  CHANGELOG_RELEASES,
  CHANGELOG_SECTION,
  CURRENT_RELEASE,
  type ChangelogRelease,
} from "@/lib/landing/changelog-content";
import { cn } from "@/lib/utils/cn";

function ReleaseHighlights({ release }: { release: ChangelogRelease }) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      {release.highlights.map((group) => (
        <div
          key={group.title}
          className="rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface-muted)]/40 p-4"
        >
          <h4 className="text-sm font-semibold text-[var(--text-primary)]">{group.title}</h4>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--text-secondary)]">
            {group.items.map((item) => (
              <li key={item} className="flex gap-2">
                <span
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand-accent)]"
                  aria-hidden
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function ReleasePanel({
  release,
  isOpen,
  onToggle,
  panelId,
  buttonId,
}: {
  release: ChangelogRelease;
  isOpen: boolean;
  onToggle: () => void;
  panelId: string;
  buttonId: string;
}) {
  const isCurrent = release.status === "current";

  return (
    <article
      className={cn(
        "overflow-hidden rounded-[var(--radius-card)] border transition-colors",
        isOpen
          ? "border-[var(--brand-primary)]/30 bg-[var(--surface-card)] shadow-sm"
          : "border-[var(--border-default)] bg-[var(--surface-card)]",
      )}
    >
      <button
        id={buttonId}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 px-5 py-5 text-left transition hover:bg-[var(--surface-muted)]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring-focus)]"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-bold text-[var(--text-primary)]">v{release.version}</span>
            {isCurrent ? (
              <Badge tone="success">Em demonstração</Badge>
            ) : (
              <Badge tone="neutral">Anterior</Badge>
            )}
            <span className="text-sm text-[var(--text-muted)]">{release.date}</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
            {release.summary}
          </p>
        </div>
        <span
          className={cn(
            "mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--border-default)] text-[var(--text-muted)] transition-transform",
            isOpen && "rotate-45 border-[var(--brand-primary)]/40 text-[var(--brand-primary)]",
          )}
          aria-hidden
        >
          +
        </span>
      </button>

      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        hidden={!isOpen}
        className="border-t border-[var(--border-default)] px-5 pb-5"
      >
        <ReleaseHighlights release={release} />
        {release.testStats ? (
          <p className="mt-5 text-xs text-[var(--text-muted)]">
            Cobertura de testes: {release.testStats}
          </p>
        ) : null}
        {isCurrent ? (
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#portais"
              className="landing-cta landing-cta--primary inline-flex items-center rounded-full px-5 py-2.5 text-sm font-semibold"
            >
              Explorar nos portais
            </a>
            <a
              href="#segmentos"
              className="landing-cta landing-cta--secondary inline-flex items-center rounded-full px-5 py-2.5 text-sm font-semibold"
            >
              Ver segmentos
            </a>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export default function LandingChangelog() {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number>(0);

  return (
    <section
      id="novidades"
      aria-labelledby="changelog-heading"
      className="border-t border-[var(--border-default)] bg-[var(--surface-muted)]"
    >
      <div className="mx-auto max-w-6xl px-6 py-24">
        <LandingSectionHeader
          id="changelog-heading"
          eyebrow={CHANGELOG_SECTION.eyebrow}
          title={CHANGELOG_SECTION.title}
          description={CHANGELOG_SECTION.description}
        />

        <div className="mt-10 rounded-2xl border border-[var(--brand-primary)]/20 bg-[var(--surface-card)] p-6 shadow-sm landing-card-hover">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="brand">{CURRENT_RELEASE.label}</Badge>
            <span className="text-sm text-[var(--text-muted)]">
              Publicado em {CURRENT_RELEASE.date}
            </span>
          </div>
          <p className="mt-4 text-base leading-relaxed text-[var(--text-secondary)]">
            {CURRENT_RELEASE.summary}
          </p>
          <p className="mt-3 text-sm text-[var(--text-muted)]">{CURRENT_RELEASE.testStats}</p>
        </div>

        <div className="mt-8 space-y-3">
          {CHANGELOG_RELEASES.map((release, index) => {
            const isOpen = openIndex === index;
            return (
              <ReleasePanel
                key={release.version}
                release={release}
                isOpen={isOpen}
                onToggle={() => setOpenIndex(isOpen ? -1 : index)}
                panelId={`${baseId}-panel-${index}`}
                buttonId={`${baseId}-button-${index}`}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
