import { cn } from "@/lib/utils/cn";
import ScrollableNavRail from "@/components/ui/ScrollableNavRail";

export type TabBarItem = {
  key: string;
  label: string;
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
        className="flex w-max min-w-full gap-1 border-b border-[var(--border-default)]"
        aria-label={ariaLabel}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onSelect(tab.key)}
            className={cn(
              "-mb-px shrink-0 snap-start border-b-2 px-4 py-2.5 text-sm font-medium transition",
              active === tab.key
                ? "border-[var(--portal-accent)] text-[var(--portal-accent)]"
                : "border-transparent text-[var(--text-muted)] hover:border-[var(--border-muted)] hover:text-[var(--text-secondary)]",
            )}
            aria-current={active === tab.key ? "page" : undefined}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </ScrollableNavRail>
  );
}
