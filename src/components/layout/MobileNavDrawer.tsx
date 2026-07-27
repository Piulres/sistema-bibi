"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import type { NavTab } from "@/components/ui/NavTabs";

type Props = {
  tabs: NavTab[];
  active?: string;
  activeClass?: string;
  idleClass?: string;
  title?: string;
};

type TabGroup = {
  name: string;
  tabs: NavTab[];
};

function groupTabs(tabs: NavTab[]): TabGroup[] {
  const order: string[] = [];
  const map = new Map<string, NavTab[]>();
  for (const tab of tabs) {
    const name = tab.group?.trim() || "Módulos";
    if (!map.has(name)) {
      map.set(name, []);
      order.push(name);
    }
    map.get(name)!.push(tab);
  }
  return order.map((name) => ({ name, tabs: map.get(name)! }));
}

/** Menu mobile em drawer — complementa NavTabs em telas abaixo de lg (1024px). */
export default function MobileNavDrawer({
  tabs,
  active,
  activeClass = "bg-[var(--surface-muted)] text-[var(--brand-accent)]",
  idleClass = "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]",
  title = "Menu",
}: Props) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const activeTab = tabs.find((t) => t.key === active);
  const currentLabel = activeTab?.label ?? title;
  const groups = useMemo(() => groupTabs(tabs), [tabs]);
  const showGroups = groups.length > 1;
  const canPortal = typeof document !== "undefined";

  useFocusTrap({
    enabled: open,
    containerRef: panelRef,
    restoreFocusRef: triggerRef,
    onEscape: () => setOpen(false),
    initialFocusSelector: "a[aria-current='page'], a, button",
  });

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={triggerRef}
        type="button"
        data-tour-id="mobile-nav-trigger"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between gap-3 rounded-[var(--radius-button)] border border-[var(--border-default)] bg-[var(--surface-card)] px-4 py-3 text-left text-sm font-medium text-[var(--text-primary)] shadow-sm transition hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
        aria-expanded={open}
        aria-controls="mobile-nav-drawer"
      >
        <span className="min-w-0">
          <span className="block text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Navegação
          </span>
          <span className="mt-0.5 block truncate">{currentLabel}</span>
        </span>
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

      {open && canPortal
        ? createPortal(
            <>
              <div
                className="fixed inset-0 z-[60] bg-black/40"
                aria-hidden="true"
                onClick={() => setOpen(false)}
              />
              <div
                id="mobile-nav-drawer"
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className="fixed inset-y-0 right-0 z-[70] flex w-[min(100%,20rem)] flex-col bg-[var(--surface-card)] shadow-xl ds-nav-drawer-enter"
              >
                <div className="flex items-center justify-between border-b border-[var(--border-default)] px-4 py-3">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
                    aria-label="Fechar"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <nav className="flex-1 overflow-y-auto p-3" aria-label={title}>
                  {groups.map((group, index) => (
                    <div
                      key={group.name}
                      className={cn(index > 0 && "mt-4 border-t border-[var(--border-default)] pt-4")}
                    >
                      {showGroups && (
                        <p className="px-3 pb-2 text-xs font-semibold text-[var(--text-primary)]">
                          {group.name}
                        </p>
                      )}
                      <ul className="space-y-0.5">
                        {group.tabs.map((tab) => (
                          <li key={tab.href}>
                            <Link
                              href={tab.href}
                              data-tour-nav={tab.key}
                              onClick={() => setOpen(false)}
                              className={cn(
                                "block rounded-[var(--radius-button)] px-3 py-2.5 text-sm font-medium transition",
                                active === tab.key ? activeClass : idleClass,
                              )}
                              aria-current={active === tab.key ? "page" : undefined}
                            >
                              {tab.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </nav>
              </div>
            </>,
            document.body,
          )
        : null}
    </div>
  );
}
