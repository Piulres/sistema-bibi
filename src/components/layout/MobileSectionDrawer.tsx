"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { SectionNavItem } from "@/components/ui/SectionNav";

type Props = {
  sections: readonly SectionNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  activeClass?: string;
  idleClass?: string;
  title?: string;
  className?: string;
};

/** Drawer mobile para navegação por seções (âncoras) em páginas de rota única. */
export default function MobileSectionDrawer({
  sections,
  activeId,
  onSelect,
  activeClass = "bg-[var(--surface-muted)] text-[var(--portal-accent)]",
  idleClass = "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]",
  title = "Seções",
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const activeSection = sections.find((s) => s.id === activeId);
  const currentLabel = activeSection?.label ?? title;

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("button")?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  function selectSection(id: string) {
    onSelect(id);
    setOpen(false);
  }

  return (
    <div className={cn("lg:hidden", className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between gap-3 rounded-[var(--radius-button)] border border-[var(--border-default)] bg-[var(--surface-card)] px-4 py-2.5 text-left text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--surface-muted)]"
        aria-expanded={open}
        aria-controls="mobile-section-drawer"
      >
        <span className="truncate">{currentLabel}</span>
        <svg
          className="h-5 w-5 shrink-0 text-[var(--text-muted)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
          />
          <div
            id="mobile-section-drawer"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="fixed inset-y-0 right-0 z-50 flex w-[min(100%,20rem)] flex-col bg-[var(--surface-card)] shadow-xl ds-nav-drawer-enter"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-default)] px-4 py-3">
              <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
                aria-label="Fechar"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-2" aria-label={title}>
              <ul className="space-y-0.5">
                {sections.map((section) => (
                  <li key={section.id}>
                    <button
                      type="button"
                      onClick={() => selectSection(section.id)}
                      className={cn(
                        "block w-full rounded-[var(--radius-button)] px-3 py-2.5 text-left text-sm font-medium transition",
                        activeId === section.id ? activeClass : idleClass,
                      )}
                      aria-current={activeId === section.id ? "true" : undefined}
                    >
                      {section.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
