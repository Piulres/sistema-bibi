import { cn } from "@/lib/utils/cn";
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
};

export default function TabBar({
  tabs,
  active,
  onSelect,
  className,
  "aria-label": ariaLabel = "Abas da página",
}: Props) {
  return (
    <ScrollableNavRail className={className} activeKey={active}>
      <nav
        className="flex w-max min-w-full gap-0.5 border-b border-[var(--border-default)]"
        aria-label={ariaLabel}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onSelect(tab.key)}
            title={tab.label}
            data-nav-key={tab.key}
            className={cn(
              "-mb-px shrink-0 snap-start border-b-2 px-2.5 py-2.5 text-sm font-medium transition",
              "min-h-11 touch-manipulation sm:px-3 xl:px-4",
              active === tab.key
                ? "border-[var(--brand-accent)] text-[var(--brand-accent)]"
                : "border-transparent text-[var(--text-muted)] hover:border-[var(--border-accent)] hover:text-[var(--brand-accent)]",
            )}
            aria-current={active === tab.key ? "page" : undefined}
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
        ))}
      </nav>
    </ScrollableNavRail>
  );
}
