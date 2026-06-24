"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import type { LandingNavContext } from "@/lib/landing/navigation";
import {
  landingNavItems,
  SEGMENT_ACCESS_HREF,
} from "@/lib/landing/navigation";
import { SEGMENT_LANDING_PAGES } from "@/lib/platform/structure";
import { getNicheConfig } from "@/lib/niche/defaults";
import { segmentPillStyle } from "@/lib/theme/segment-colors";
import { landingCtaClasses } from "@/components/landing/landing-cta";

type Props = {
  context?: LandingNavContext;
};

export default function LandingMobileMenu({ context = "home" }: Props) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const anchors = landingNavItems(context);

  const activeSegmentSlug = pathname.startsWith("/segmentos/")
    ? pathname.replace("/segmentos/", "")
    : null;

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-md p-2 text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
        aria-expanded={open}
        aria-controls="landing-mobile-menu"
        aria-label="Abrir menu"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
          />
          <div
            id="landing-mobile-menu"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
            className="fixed inset-y-0 right-0 z-50 flex w-[min(100%,20rem)] flex-col bg-[var(--surface-card)] shadow-xl ds-nav-drawer-enter"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-default)] px-4 py-3">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Menu</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
                aria-label="Fechar"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3" aria-label="Seções da landing">
              <ul className="space-y-1">
                {context === "segment" && (
                  <li>
                    <Link
                      href="/"
                      onClick={() => setOpen(false)}
                      className="block rounded-[var(--radius-button)] px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--brand-accent)]"
                    >
                      Início
                    </Link>
                  </li>
                )}
                {anchors.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "block rounded-[var(--radius-button)] px-3 py-2.5 text-sm font-medium",
                        "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--brand-accent)]",
                      )}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>

              {context === "segment" && (
                <>
                  <p className="mt-4 px-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                    Alternar segmento
                  </p>
                  <ul className="mt-1 flex flex-wrap gap-1.5 px-2">
                    {SEGMENT_LANDING_PAGES.map((page) => {
                      const config = getNicheConfig(page.niche);
                      const isActive = activeSegmentSlug === page.slug;
                      return (
                        <li key={page.slug}>
                          <Link
                            href={page.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "inline-block rounded-full border px-2.5 py-1 text-xs font-medium",
                              isActive && "shadow-sm",
                            )}
                            style={segmentPillStyle(page.niche, isActive)}
                          >
                            {config.name}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}

              <ul className="mt-4 space-y-1 border-t border-[var(--border-default)] pt-3">
                <li>
                  <Link
                    href="/beneficiario/login"
                    onClick={() => setOpen(false)}
                    className="block rounded-[var(--radius-button)] px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
                  >
                    Entrar
                  </Link>
                </li>
                <li>
                  {context === "home" ? (
                    <Link
                      href={SEGMENT_ACCESS_HREF}
                      onClick={() => setOpen(false)}
                      className={landingCtaClasses("surface", "md", "mx-3 mt-2 w-[calc(100%-1.5rem)]")}
                    >
                      Acessar portais
                    </Link>
                  ) : (
                    <a
                      href="#portais"
                      onClick={() => setOpen(false)}
                      className={landingCtaClasses("surface", "md", "mx-3 mt-2 w-[calc(100%-1.5rem)]")}
                    >
                      Acessar portais
                    </a>
                  )}
                </li>
              </ul>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
