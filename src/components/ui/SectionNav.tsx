"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

export type SectionNavItem = {
  id: string;
  label: string;
};

type Props = {
  sections: readonly SectionNavItem[];
  activeClass?: string;
  idleClass?: string;
  className?: string;
};

/** Navegação por âncoras em páginas de rota única — scroll suave entre seções. */
export default function SectionNav({
  sections,
  activeClass = "border-[var(--portal-accent)] text-[var(--portal-accent)]",
  idleClass = "border-transparent text-[var(--text-muted)] hover:border-[var(--border-default)] hover:text-[var(--text-secondary)]",
  className,
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
    <nav
      aria-label="Seções da página"
      className={cn(
        "flex gap-2 overflow-x-auto border-b border-[var(--border-default)] pb-px",
        "snap-x snap-mandatory scroll-px-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
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
  );
}
