"use client";

import { useId, useState } from "react";
import type { LandingFaqItem } from "@/lib/niche/landing-content";
import { cn } from "@/lib/utils/cn";

type Props = {
  items: LandingFaqItem[];
};

export default function LandingFaqAccordion({ items }: Props) {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <dl className="mt-12 space-y-3">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const panelId = `${baseId}-panel-${index}`;
        const buttonId = `${baseId}-button-${index}`;

        return (
          <div
            key={item.question}
            className={cn(
              "overflow-hidden rounded-[var(--radius-card)] border transition-colors",
              isOpen
                ? "border-[var(--brand-primary)]/30 bg-[var(--surface-card)] shadow-sm"
                : "border-[var(--border-default)] bg-[var(--surface-card)]",
            )}
          >
            <dt>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-base font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-muted)]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring-focus)]"
              >
                {item.question}
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--border-default)] text-[var(--text-muted)] transition-transform",
                    isOpen && "rotate-45 border-[var(--brand-primary)]/40 text-[var(--brand-primary)]",
                  )}
                  aria-hidden
                >
                  +
                </span>
              </button>
            </dt>
            <dd
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className="px-5 pb-5 text-sm leading-relaxed text-[var(--text-secondary)]"
            >
              {item.answer}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
