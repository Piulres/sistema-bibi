"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import ScrollableNavRail from "@/components/ui/ScrollableNavRail";
import NavOverflowMenu from "@/components/ui/NavOverflowMenu";
import { NavModuleIcon } from "@/lib/navigation/nav-icons";

export type NavTab = {
  href: string;
  label: string;
  /** Rótulo curto até `xl` — evita corte na faixa desktop. */
  shortLabel?: string;
  key: string;
  /** Agrupamento no drawer mobile e menu Mais. */
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

function tabClassName(isActive: boolean, activeClass: string, idleClass: string) {
  return cn(
    "inline-flex shrink-0 snap-start items-center gap-2 rounded-xl px-3 py-2",
    "text-sm font-medium transition-all duration-200 touch-manipulation",
    focusTabClass,
    isActive ? activeClass : idleClass,
  );
}

export default function NavTabs({
  tabs,
  active,
  activeClass = "bg-[var(--brand-accent)] text-white shadow-sm",
  idleClass = "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]",
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

  const [moreSession, setMoreSession] = useState<{ activeKey: string; open: boolean }>({
    activeKey: active ?? "",
    open: false,
  });
  const moreOpen = moreSession.open && moreSession.activeKey === (active ?? "");
  const setMoreOpen = (open: boolean) => {
    setMoreSession({ activeKey: active ?? "", open });
  };
  const moreTriggerRef = useRef<HTMLButtonElement>(null);

  return (
    <ScrollableNavRail className={className} activeKey={active}>
      <nav
        className={cn(
          "flex w-max min-w-full items-center gap-1 rounded-2xl border border-[var(--border-default)]",
          "bg-[var(--surface-card)]/90 p-1.5 shadow-sm backdrop-blur-sm",
        )}
        aria-label="Navegação por abas"
      >
        {railTabs.map((tab) => {
          const isActive = active === tab.key;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              title={tab.label}
              data-tour-nav={tab.key}
              data-nav-key={tab.key}
              className={tabClassName(isActive, activeClass, idleClass)}
              aria-current={isActive ? "page" : undefined}
            >
              <NavModuleIcon navKey={tab.key} className={cn("h-4 w-4", isActive && "opacity-100")} />
              <TabLabel tab={tab} />
            </Link>
          );
        })}

        {moreTabs.length > 0 && (
          <div className="relative flex shrink-0 snap-start items-center pl-0.5">
            <span className="mx-1 h-6 w-px bg-[var(--border-default)]" aria-hidden />
            <button
              ref={moreTriggerRef}
              type="button"
              data-tour-nav="more"
              aria-expanded={moreOpen}
              aria-haspopup="menu"
              title="Mais módulos"
              onClick={() => setMoreOpen(!moreOpen)}
              className={cn(
                "inline-flex min-h-9 items-center gap-2 rounded-xl px-3 py-2",
                "text-sm font-medium transition-all duration-200 touch-manipulation",
                focusTabClass,
                moreOpen
                  ? "bg-[var(--surface-muted)] text-[var(--text-primary)] shadow-inner"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]",
              )}
            >
              <NavModuleIcon navKey="more" />
              Mais
              <svg
                className={cn("h-3.5 w-3.5 opacity-70 transition-transform", moreOpen && "rotate-180")}
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            <NavOverflowMenu
              items={moreTabs}
              activeKey={active}
              open={moreOpen}
              onOpenChange={setMoreOpen}
              triggerRef={moreTriggerRef}
              hasPinnedSecondary={Boolean(activeSecondary)}
            />
          </div>
        )}
      </nav>
    </ScrollableNavRail>
  );
}
