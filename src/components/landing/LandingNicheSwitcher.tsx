"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { SEGMENT_LANDING_PAGES } from "@/lib/platform/structure";
import { getNicheConfig } from "@/lib/niche/defaults";

type Props = {
  className?: string;
};

/** Seletor de segmento — links para `/segmentos/[slug]`. */
export default function LandingNicheSwitcher({ className = "" }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTenant = searchParams.get("tenant")?.toLowerCase() ?? null;
  const activeNiche = searchParams.get("niche")?.toUpperCase() ?? null;

  const isLandingRoute =
    pathname === "/" || pathname.startsWith("/segmentos/");

  if (!isLandingRoute) return null;

  const activeSegmentSlug = pathname.startsWith("/segmentos/")
    ? pathname.replace("/segmentos/", "")
    : null;

  return (
    <div
      className={`flex w-max min-w-full flex-nowrap items-center gap-1.5 sm:w-auto sm:flex-wrap ${className}`}
      role="navigation"
      aria-label="Selecionar segmento de demonstração"
    >
      <span className="mr-1 hidden text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] sm:inline">
        Segmento:
      </span>
      {SEGMENT_LANDING_PAGES.map((page) => {
        const config = getNicheConfig(page.niche);
        const isActive =
          activeSegmentSlug === page.slug ||
          (pathname === "/" &&
            (activeTenant === page.tenantSlug ||
              (!activeTenant && page.niche === "MEDICAL" && !activeNiche) ||
              (!activeTenant && activeNiche === page.niche)));

        return (
          <Link
            key={page.slug}
            href={page.href}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] ${
              isActive
                ? "bg-[var(--brand-primary)] text-[var(--text-inverse)] shadow-sm"
                : "border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--brand-accent)]"
            }`}
            aria-current={isActive ? "page" : undefined}
            title={page.label}
          >
            {config.name}
          </Link>
        );
      })}
    </div>
  );
}
