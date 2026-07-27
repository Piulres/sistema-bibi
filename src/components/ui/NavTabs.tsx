"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import ScrollableNavRail from "@/components/ui/ScrollableNavRail";
import { useMenuKeyboard } from "@/hooks/useMenuKeyboard";

export type NavTab = {
  href: string;
  label: string;
  /** Rótulo curto até `xl` — evita corte na faixa desktop. */
  shortLabel?: string;
  key: string;
  /** Agrupamento no drawer mobile. */
  group?: string;
  /**
   * `secondary` vai para o menu **Mais** no desktop quando o portal
   * declara prioridade mista (ex.: interno com 14 módulos).
   */
  priority?: "primary" | "secondary";
};

type Props = {
  tabs: NavTab[];
  active?: string;
  activeClass?: string;
  idleClass?: string;
  className?: string;
};

const focusTabClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] focus-visible:ring-offset-2";

function TabLabel({ tab }: { tab: NavTab }) {
  if (!tab.shortLabel) return <>{tab.label}</>;
  return (
    <>
      <span className="xl:hidden">{tab.shortLabel}</span>
      <span className="hidden xl:inline">{tab.label}</span>
    </>
  );
}

function tabClassName(
  isActive: boolean,
  activeClass: string,
  idleClass: string,
) {
  return cn(
    "-mb-px shrink-0 snap-start border-b-2 text-sm font-medium transition",
    "min-h-11 touch-manipulation px-2.5 py-2.5 sm:px-3 xl:px-4",
    focusTabClass,
    isActive ? activeClass : idleClass,
  );
}

export default function NavTabs({
  tabs,
  active,
  activeClass = "border-[var(--brand-accent)] text-[var(--brand-accent)]",
  idleClass = "border-transparent text-[var(--text-muted)] hover:border-[var(--border-accent)] hover:text-[var(--brand-accent)]",
  className,
}: Props) {
  const hasPrioritySplit = tabs.some((tab) => tab.priority === "secondary");
  const primaryTabs = hasPrioritySplit
    ? tabs.filter((tab) => tab.priority !== "secondary")
    : tabs;
  const secondaryTabs = hasPrioritySplit
    ? tabs.filter((tab) => tab.priority === "secondary")
    : [];
  const activeSecondary = secondaryTabs.find((tab) => tab.key === active);
  const railTabs = activeSecondary ? [...primaryTabs, activeSecondary] : primaryTabs;
  const moreTabs = activeSecondary
    ? secondaryTabs.filter((tab) => tab.key !== active)
    : secondaryTabs;

  const [moreOpen, setMoreOpen] = useState(false);
  const [menuActive, setMenuActive] = useState(active);
  const moreRef = useRef<HTMLDivElement>(null);
  const moreTriggerRef = useRef<HTMLButtonElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuId = useId();

  if (active !== menuActive) {
    setMenuActive(active);
    if (moreOpen) setMoreOpen(false);
  }

  useMenuKeyboard({
    open: moreOpen,
    menuRef: moreMenuRef,
    triggerRef: moreTriggerRef,
    onClose: () => setMoreOpen(false),
  });

  useEffect(() => {
    if (!moreOpen) return;
    const onPointer = (event: MouseEvent) => {
      if (!moreRef.current?.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("mousedown", onPointer);
    };
  }, [moreOpen]);

  return (
    <ScrollableNavRail className={className} activeKey={active}>
      <nav
        className="flex w-max min-w-full items-stretch gap-0.5 border-b border-[var(--border-default)]"
        aria-label="Navegação por abas"
      >
        {railTabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            title={tab.label}
            data-tour-nav={tab.key}
            data-nav-key={tab.key}
            className={tabClassName(active === tab.key, activeClass, idleClass)}
            aria-current={active === tab.key ? "page" : undefined}
          >
            <TabLabel tab={tab} />
          </Link>
        ))}

        {moreTabs.length > 0 && (
          <div ref={moreRef} className="relative shrink-0 snap-start self-stretch">
            <button
              ref={moreTriggerRef}
              type="button"
              data-tour-nav="more"
              aria-expanded={moreOpen}
              aria-controls={moreMenuId}
              aria-haspopup="menu"
              title="Mais módulos"
              onClick={() => setMoreOpen((open) => !open)}
              className={cn(
                tabClassName(false, activeClass, idleClass),
                "inline-flex items-center gap-1",
                moreOpen && "border-[var(--border-accent)] text-[var(--brand-accent)]",
              )}
            >
              Mais
              <svg className="h-3.5 w-3.5 opacity-70" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            {moreOpen && (
              <div
                id={moreMenuId}
                ref={moreMenuRef}
                role="menu"
                aria-label="Mais módulos"
                className="absolute right-0 top-full z-40 mt-1 min-w-[12rem] rounded-[var(--radius-button)] border border-[var(--border-default)] bg-[var(--surface-card)] py-1 shadow-lg"
              >
                {moreTabs.map((tab) => (
                  <Link
                    key={tab.href}
                    role="menuitem"
                    href={tab.href}
                    title={tab.label}
                    data-tour-nav={tab.key}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "block px-3 py-2.5 text-sm font-medium transition hover:bg-[var(--surface-muted)]",
                      focusTabClass,
                      active === tab.key
                        ? "text-[var(--brand-accent)]"
                        : "text-[var(--text-secondary)]",
                    )}
                    aria-current={active === tab.key ? "page" : undefined}
                  >
                    {tab.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>
    </ScrollableNavRail>
  );
}
