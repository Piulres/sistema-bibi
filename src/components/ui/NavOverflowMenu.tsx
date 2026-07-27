"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { useMenuKeyboard } from "@/hooks/useMenuKeyboard";

export type NavOverflowItem = {
  href: string;
  label: string;
  key: string;
};

type Props = {
  items: NavOverflowItem[];
  activeKey?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  /** Quando um módulo secundário está pinado na faixa principal. */
  hasPinnedSecondary?: boolean;
};

const focusItemClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] focus-visible:ring-inset";

/** Menu overflow portaled — evita clip do ScrollableNavRail e sobreposição na página. */
export default function NavOverflowMenu({
  items,
  activeKey,
  open,
  onOpenChange,
  triggerRef,
  hasPinnedSecondary = false,
}: Props) {
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const canPortal = typeof document !== "undefined";

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const menuWidth = 192;
    const padding = 8;
    const left = Math.min(
      Math.max(padding, rect.right - menuWidth),
      window.innerWidth - menuWidth - padding,
    );
    setCoords({ top: rect.bottom + 6, left });
  }, [triggerRef]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition, items.length]);

  useEffect(() => {
    if (!open) return;
    const onScrollOrResize = () => updatePosition();
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    return () => {
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [open, updatePosition]);

  useMenuKeyboard({
    open,
    menuRef,
    triggerRef,
    onClose: () => onOpenChange(false),
  });

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      onOpenChange(false);
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open, onOpenChange, triggerRef]);

  if (!open || !canPortal || items.length === 0) return null;
  if (!coords) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[45]"
        aria-hidden="true"
        onClick={() => onOpenChange(false)}
      />
      <div
        id={menuId}
        ref={menuRef}
        role="menu"
        aria-label="Mais módulos"
        style={{ top: coords.top, left: coords.left }}
        className={cn(
          "fixed z-[50] w-48 max-h-[min(70vh,20rem)] overflow-y-auto",
          "rounded-[var(--radius-button)] border border-[var(--border-default)]",
          "bg-[var(--surface-card)] py-1 shadow-lg overflow-y-auto",
          hasPinnedSecondary && "ring-1 ring-[var(--border-default)]",
        )}
      >
        {items.map((item) => {
          const selected = activeKey === item.key;
          return (
            <Link
              key={item.href}
              role="menuitem"
              href={item.href}
              title={item.label}
              data-tour-nav={item.key}
              data-nav-key={item.key}
              onClick={() => onOpenChange(false)}
              className={cn(
                "block px-3 py-2.5 text-sm font-medium transition hover:bg-[var(--surface-muted)]",
                focusItemClass,
                selected
                  ? "bg-[var(--surface-muted)] text-[var(--brand-accent)]"
                  : "text-[var(--text-secondary)]",
              )}
              aria-current={selected ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </>,
    document.body,
  );
}
