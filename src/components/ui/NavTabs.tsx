import Link from "next/link";
import { cn } from "@/lib/utils/cn";

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
  activeClass = "border-[var(--portal-accent)] text-[var(--portal-accent)]",
  idleClass = "border-transparent text-[var(--text-muted)] hover:border-[var(--border-default)] hover:text-[var(--text-secondary)]",
  className,
}: Props) {
  return (
    <nav
      className={cn(
        "flex gap-2 overflow-x-auto border-b border-[var(--border-default)]",
        "snap-x snap-mandatory scroll-px-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
      aria-label="Navegação por abas"
    >
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
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
  );
}
