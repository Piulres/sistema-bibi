"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import ScrollableNavRail from "@/components/ui/ScrollableNavRail";
import MobileSectionDrawer from "@/components/layout/MobileSectionDrawer";

export type SectionNavItem = {
  id: string;
  label: string;
};

type Props = {
  sections: readonly SectionNavItem[];
  activeClass?: string;
  idleClass?: string;
  className?: string;
  drawerTitle?: string;
};

/** Navegação por âncoras — drawer em mobile/tablet, faixa rolável em desktop largo. */
export default function SectionNav({
  sections,
  activeClass = "border-[var(--brand-accent)] text-[var(--brand-accent)]",
  idleClass = "border-transparent text-[var(--text-muted)] hover:border-[var(--border-accent)] hover:text-[var(--brand-accent)]",
  className,
  drawerTitle = "Seções da página",
}: Props) {
  const [activeId, setActiveId] = useState(() => sections[0]?.id ?? "");

  const handleClick = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveId(id);
      window.history.replaceState(null, "", `#${id}`);
    }
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      const hash = window.location.hash.replace("#", "");
      if (hash && sections.some((s) => s.id === hash)) {
        if (!active) return;
        setActiveId(hash);
        requestAnimationFrame(() => {
          document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    })();

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.25, 0.5] },
    );

    for (const section of sections) {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    }

    return () => {
      active = false;
      observer.disconnect();
    };
  }, [sections]);

  return (
    <div className={className} data-tour-id="portal-nav">
      <MobileSectionDrawer
        sections={sections}
        activeId={activeId}
        onSelect={handleClick}
        activeClass="bg-[var(--surface-muted)] text-[var(--brand-accent)]"
        idleClass="text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
        title={drawerTitle}
      />
      <ScrollableNavRail className="hidden lg:block">
        <nav
          aria-label="Seções da página"
          className="flex w-max min-w-full gap-2 border-b border-[var(--border-default)] pb-px"
        >
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              data-tour-nav={section.id}
              onClick={() => handleClick(section.id)}
              className={cn(
                "-mb-px shrink-0 snap-start border-b-2 px-4 py-2 text-sm font-medium transition",
                activeId === section.id ? activeClass : idleClass,
              )}
              aria-current={activeId === section.id ? "true" : undefined}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </ScrollableNavRail>
    </div>
  );
}
