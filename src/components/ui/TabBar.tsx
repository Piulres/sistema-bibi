import { cn } from "@/lib/utils/cn";

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
    <nav
      className={cn(
        "flex gap-1 overflow-x-auto border-b border-[var(--border-default)]",
        "snap-x snap-mandatory scroll-px-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
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
  );
}
