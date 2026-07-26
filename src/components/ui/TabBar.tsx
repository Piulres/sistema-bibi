import { cn } from "@/lib/utils/cn";
import ScrollableNavRail from "@/components/ui/ScrollableNavRail";

export type TabBarItem = {
  key: string;
  label: string;
  /** Rótulo curto em viewports estreitas (mobile). */
  shortLabel?: string;
};

type Props = {
  tabs: TabBarItem[];
  active: string;
  onSelect: (key: string) => void;
  className?: string;
  "aria-label"?: string;
};

export default function TabBar({
  tabs,
  active,
  onSelect,
  className,
  "aria-label": ariaLabel = "Abas da página",
}: Props) {
  return (
    <ScrollableNavRail className={className}>
      <nav
        className="flex w-max min-w-full gap-0.5 border-b border-[var(--border-default)] sm:gap-1"
        aria-label={ariaLabel}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onSelect(tab.key)}
            title={tab.label}
            className={cn(
              "-mb-px shrink-0 snap-start border-b-2 px-3 py-3 text-sm font-medium transition sm:px-4 sm:py-2.5",
              "min-h-11 touch-manipulation",
              active === tab.key
                ? "border-[var(--brand-accent)] text-[var(--brand-accent)]"
                : "border-transparent text-[var(--text-muted)] hover:border-[var(--border-accent)] hover:text-[var(--brand-accent)]",
            )}
            aria-current={active === tab.key ? "page" : undefined}
          >
            {tab.shortLabel ? (
              <>
                <span className="sm:hidden">{tab.shortLabel}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </>
            ) : (
              tab.label
            )}
          </button>
        ))}
      </nav>
    </ScrollableNavRail>
  );
}
