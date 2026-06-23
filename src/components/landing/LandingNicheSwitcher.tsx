"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { NICHE_IDS, isNicheId } from "@/lib/niche/types";
import { getNicheConfig } from "@/lib/niche/defaults";

type Props = {
  className?: string;
};

/** Seletor de nicho na landing — links para `/?niche=`. */
export default function LandingNicheSwitcher({ className = "" }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const nicheParam = searchParams.get("niche")?.toUpperCase() ?? null;
  const activeNiche = nicheParam && isNicheId(nicheParam) ? nicheParam : "MEDICAL";

  if (pathname !== "/") return null;

  return (
    <div
      className={`flex flex-wrap items-center gap-1.5 ${className}`}
      role="navigation"
      aria-label="Selecionar nicho de demonstração"
    >
      <span className="mr-1 hidden text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] sm:inline">
        Nicho:
      </span>
      {NICHE_IDS.map((id) => {
        const config = getNicheConfig(id);
        const isActive = activeNiche === id;
        const href = id === "MEDICAL" ? "/" : `/?niche=${id}`;

        return (
          <Link
            key={id}
            href={href}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] ${
              isActive
                ? "bg-[var(--brand-primary)] text-[var(--text-inverse)] shadow-sm"
                : "border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            {config.name}
          </Link>
        );
      })}
    </div>
  );
}
