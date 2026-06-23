"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { SEGMENT_TENANTS } from "@/lib/niche/demo-accounts";
import { getNicheConfig } from "@/lib/niche/defaults";

type Props = {
  className?: string;
};

/** Seletor de segmento na landing — links para `/?tenant=slug`. */
export default function LandingNicheSwitcher({ className = "" }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTenant = searchParams.get("tenant")?.toLowerCase() ?? null;
  const activeNiche = searchParams.get("niche")?.toUpperCase() ?? null;

  if (pathname !== "/") return null;

  return (
    <div
      className={`flex w-max min-w-full flex-nowrap items-center gap-1.5 sm:w-auto sm:flex-wrap ${className}`}
      role="navigation"
      aria-label="Selecionar segmento de demonstração"
    >
      <span className="mr-1 hidden text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] sm:inline">
        Segmento:
      </span>
      {SEGMENT_TENANTS.map((ref) => {
        const config = getNicheConfig(ref.niche);
        const isActive =
          activeTenant === ref.slug ||
          (!activeTenant && ref.niche === "MEDICAL" && !activeNiche) ||
          (!activeTenant && activeNiche === ref.niche);
        const href = `/?tenant=${ref.slug}`;

        return (
          <Link
            key={ref.slug}
            href={href}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] ${
              isActive
                ? "bg-[var(--brand-primary)] text-[var(--text-inverse)] shadow-sm"
                : "border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
            }`}
            aria-current={isActive ? "page" : undefined}
            title={ref.tenant}
          >
            {config.name}
          </Link>
        );
      })}
    </div>
  );
}
