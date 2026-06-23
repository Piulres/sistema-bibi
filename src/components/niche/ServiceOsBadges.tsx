"use client";

import { PLATFORM } from "@/lib/platform";
import { getNicheConfig } from "@/lib/niche/defaults";
import type { NicheId } from "@/lib/niche/types";

type Props = {
  niche: NicheId;
  variant?: "header" | "inline";
};

/** Indicadores visuais da plataforma e nicho ativo. */
export default function ServiceOsBadges({ niche, variant = "header" }: Props) {
  const nicheName = getNicheConfig(niche).name;

  if (variant === "inline") {
    return (
      <span className="inline-flex flex-wrap items-center gap-1.5">
        <span className="rounded-full bg-[var(--brand-primary)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--brand-primary)]">
          {PLATFORM.versionLabel}
        </span>
        <span className="rounded-full border border-[var(--border-default)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]">
          {nicheName}
        </span>
      </span>
    );
  }

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1.5">
      <span className="rounded-full bg-[var(--brand-primary)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--brand-primary)]">
        {PLATFORM.versionLabel}
      </span>
      <span className="rounded-full border border-[var(--border-default)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]">
        <span className="hidden sm:inline">Nicho: </span>
        {nicheName}
      </span>
    </div>
  );
}
