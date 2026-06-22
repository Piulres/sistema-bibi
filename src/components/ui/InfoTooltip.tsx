"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils/cn";

type Props = {
  content: string;
  label?: string;
  className?: string;
};

/** Botão de ajuda acessível — descreve termos e KPIs para leitores de tela. */
export default function InfoTooltip({ content, label = "Mais informações", className }: Props) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();

  return (
    <span className={cn("relative inline-flex", className)}>
      <button
        type="button"
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--border-muted)] bg-[var(--surface-muted)] text-[10px] font-bold text-[var(--text-muted)] transition hover:border-[var(--border-default)] hover:text-[var(--text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
        aria-label={label}
        aria-describedby={open ? tooltipId : undefined}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
      >
        ?
      </button>
      {open ? (
        <span
          id={tooltipId}
          role="tooltip"
          className="absolute left-1/2 top-full z-20 mt-1.5 w-56 -translate-x-1/2 rounded-[var(--radius-button)] border border-[var(--border-default)] bg-[var(--surface-card)] px-3 py-2 text-xs leading-relaxed text-[var(--text-secondary)] shadow-[var(--shadow-card)]"
        >
          {content}
        </span>
      ) : null}
    </span>
  );
}
