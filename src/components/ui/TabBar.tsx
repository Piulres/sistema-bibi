"use client";

import { useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils/cn";
import { resolveRovingKey } from "@/lib/a11y/focus";
import ScrollableNavRail from "@/components/ui/ScrollableNavRail";

export type TabBarItem = {
  key: string;
  label: string;
  /** Rótulo curto em viewports estreitas / colunas com sidebar. */
  shortLabel?: string;
};

type Props = {
  tabs: TabBarItem[];
  active: string;
  onSelect: (key: string) => void;
  className?: string;
  "aria-label"?: string;
  /** Prefixo para `aria-controls` / id do tabpanel no consumidor (opcional). */
  panelIdPrefix?: string;
};

const focusTabClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] focus-visible:ring-offset-2";

export default function TabBar({
  tabs,
  active,
  onSelect,
  className,
  "aria-label": ariaLabel = "Abas da página",
  panelIdPrefix,
}: Props) {
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  function focusAndSelect(key: string) {
    onSelect(key);
    requestAnimationFrame(() => {
      tabRefs.current.get(key)?.focus();
    });
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, key: string) {
    const index = tabs.findIndex((tab) => tab.key === key);
    if (index < 0) return;

    const result = resolveRovingKey(event.key, index, tabs.length, "horizontal");
    if (result.type === "none") return;

    event.preventDefault();
    const next = tabs[result.index];
    if (next) focusAndSelect(next.key);
  }

  return (
    <ScrollableNavRail className={className} activeKey={active}>
      <div
        role="tablist"
        className="flex w-max min-w-full gap-0.5 border-b border-[var(--border-default)]"
        aria-label={ariaLabel}
      >
        {tabs.map((tab) => {
          const selected = active === tab.key;
          const panelId = panelIdPrefix
            ? `${panelIdPrefix}-${tab.key}`
            : undefined;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              id={panelIdPrefix ? `${panelIdPrefix}-tab-${tab.key}` : undefined}
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              onClick={() => onSelect(tab.key)}
              onKeyDown={(event) => onTabKeyDown(event, tab.key)}
              title={tab.label}
              data-nav-key={tab.key}
              ref={(node) => {
                if (node) tabRefs.current.set(tab.key, node);
                else tabRefs.current.delete(tab.key);
              }}
              className={cn(
                "-mb-px shrink-0 snap-start border-b-2 px-2.5 py-2.5 text-sm font-medium transition",
                "min-h-11 touch-manipulation sm:px-3 xl:px-4",
                focusTabClass,
                selected
                  ? "border-[var(--brand-accent)] text-[var(--brand-accent)]"
                  : "border-transparent text-[var(--text-muted)] hover:border-[var(--border-accent)] hover:text-[var(--brand-accent)]",
              )}
            >
              {tab.shortLabel ? (
                <>
                  {/* shortLabel até xl: coluna com sidebar corta rótulos longos no desktop médio */}
                  <span className="xl:hidden">{tab.shortLabel}</span>
                  <span className="hidden xl:inline">{tab.label}</span>
                </>
              ) : (
                tab.label
              )}
            </button>
          );
        })}
      </div>
    </ScrollableNavRail>
  );
}
