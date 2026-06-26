import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import ScrollableNavRail from "@/components/ui/ScrollableNavRail";

export type NavTab = {
  href: string;
  label: string;
  key: string;
};

type Props = {
  tabs: NavTab[];
  active?: string;
  activeClass?: string;
  idleClass?: string;
  className?: string;
};

export default function NavTabs({
  tabs,
  active,
  activeClass = "border-[var(--brand-accent)] text-[var(--brand-accent)]",
  idleClass = "border-transparent text-[var(--text-muted)] hover:border-[var(--border-accent)] hover:text-[var(--brand-accent)]",
  className,
}: Props) {
  return (
    <ScrollableNavRail className={className}>
      <nav
        className="flex w-max min-w-full gap-2 border-b border-[var(--border-default)]"
        aria-label="Navegação por abas"
      >
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            data-tour-nav={tab.key}
            className={cn(
              "-mb-px shrink-0 snap-start border-b-2 px-4 py-2 text-sm font-medium transition",
              active === tab.key ? activeClass : idleClass,
            )}
            aria-current={active === tab.key ? "page" : undefined}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </ScrollableNavRail>
  );
}
