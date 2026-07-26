"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type Props = {
  children: ReactNode;
  className?: string;
  /** Quando muda, rola o item `[data-nav-key]` / `[aria-current]` para a área visível. */
  activeKey?: string;
};

/** Faixa horizontal com scroll, gradientes e setas quando o conteúdo transborda. */
export default function ScrollableNavRail({ children, className, activeKey }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(maxScroll > 4 && el.scrollLeft < maxScroll - 4);
  }, []);

  const scrollActiveIntoView = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const activeEl =
      (activeKey
        ? el.querySelector<HTMLElement>(`[data-nav-key="${CSS.escape(activeKey)}"]`)
        : null) ??
      el.querySelector<HTMLElement>('[aria-current="page"], [aria-current="true"]');
    if (!activeEl) return;
    activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    requestAnimationFrame(updateScrollState);
  }, [activeKey, updateScrollState]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateScrollState();
    // Remedir após paint — largura dos botões de aba pode ainda não estar estável.
    const raf = requestAnimationFrame(() => {
      updateScrollState();
      scrollActiveIntoView();
    });

    el.addEventListener("scroll", updateScrollState, { passive: true });
    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(el);
    // Observa o filho (nav) — tabs dinâmicas mudam scrollWidth sem redimensionar o wrapper.
    const child = el.firstElementChild;
    if (child) resizeObserver.observe(child);

    const mutationObserver = new MutationObserver(updateScrollState);
    mutationObserver.observe(el, { childList: true, subtree: true, characterData: true });

    window.addEventListener("resize", updateScrollState);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", updateScrollState);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState, scrollActiveIntoView, children]);

  useEffect(() => {
    const raf = requestAnimationFrame(scrollActiveIntoView);
    return () => cancelAnimationFrame(raf);
  }, [activeKey, scrollActiveIntoView]);

  function scrollByPage(direction: -1 | 1) {
    scrollRef.current?.scrollBy({ left: direction * 180, behavior: "smooth" });
  }

  return (
    <div className={cn("relative min-w-0 max-w-full overflow-hidden", className)}>
      {canScrollLeft && (
        <>
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[var(--surface-page)] via-[var(--surface-page)]/80 to-transparent"
            aria-hidden
          />
          <button
            type="button"
            onClick={() => scrollByPage(-1)}
            className="absolute left-1 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-secondary)] shadow-sm transition hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
            aria-label="Rolar navegação para a esquerda"
          >
            <ChevronIcon direction="left" />
          </button>
        </>
      )}

      {canScrollRight && (
        <>
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[var(--surface-page)] via-[var(--surface-page)]/80 to-transparent"
            aria-hidden
          />
          <button
            type="button"
            onClick={() => scrollByPage(1)}
            className="absolute right-1 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-secondary)] shadow-sm transition hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
            aria-label="Rolar navegação para a direita"
          >
            <ChevronIcon direction="right" />
          </button>
        </>
      )}

      <div
        ref={scrollRef}
        className={cn(
          "ds-scroll-x min-w-0 max-w-full scroll-smooth overflow-x-auto",
          "snap-x snap-proximity scroll-px-4",
          "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          canScrollLeft && "pl-9",
          canScrollRight && "pr-9",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d={direction === "left" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
      />
    </svg>
  );
}
