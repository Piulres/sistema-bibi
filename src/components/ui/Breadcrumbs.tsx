import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import type { BreadcrumbItem } from "@/lib/navigation";

type Props = {
  items: BreadcrumbItem[];
  className?: string;
};

/** Trilha de navegação hierárquica — último item é a página atual. */
export default function Breadcrumbs({ items, className }: Props) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("text-sm", className)}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 && (
                <span className="text-[var(--text-muted)]" aria-hidden>
                  /
                </span>
              )}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="font-medium text-[var(--portal-accent)] transition hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    isLast
                      ? "font-medium text-[var(--text-primary)]"
                      : "text-[var(--text-muted)]",
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
