"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { useMenuKeyboard } from "@/hooks/useMenuKeyboard";
import { NavModuleIcon } from "@/lib/navigation/nav-icons";

export type NavOverflowItem = {
  href: string;
  label: string;
  key: string;
  group?: string;
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

const GROUP_ORDER = ["Operação", "Financeiro", "Administração", "Agenda", "Conta", "Clínico", "Obra"];

/** Menu overflow portaled — painel agrupado estilo app moderno. */
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

  const groupedItems = useMemo(() => {
    const map = new Map<string, NavOverflowItem[]>();
    for (const item of items) {
      const group = item.group ?? "Outros";
      const list = map.get(group) ?? [];
      list.push(item);
      map.set(group, list);
    }
    return [...map.entries()].sort(([a], [b]) => {
      const ai = GROUP_ORDER.indexOf(a);
      const bi = GROUP_ORDER.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }, [items]);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const menuWidth = 300;
    const padding = 12;
    const left = Math.min(
      Math.max(padding, rect.right - menuWidth),
      window.innerWidth - menuWidth - padding,
    );
    setCoords({ top: rect.bottom + 8, left });
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
        className="fixed inset-0 z-[45] bg-[var(--surface-inverse)]/10 backdrop-blur-[1px]"
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
          "fixed z-[50] w-[min(300px,calc(100vw-1.5rem))] max-h-[min(70vh,24rem)] overflow-y-auto",
          "rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-2 shadow-xl",
          hasPinnedSecondary && "ring-1 ring-[var(--brand-accent)]/20",
        )}
      >
        {groupedItems.map(([group, groupItems]) => (
          <div key={group} className="mb-1 last:mb-0">
            <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              {group}
            </p>
            <ul className="space-y-0.5">
              {groupItems.map((item) => {
                const selected = activeKey === item.key;
                return (
                  <li key={item.href}>
                    <Link
                      role="menuitem"
                      href={item.href}
                      title={item.label}
                      data-tour-nav={item.key}
                      data-nav-key={item.key}
                      onClick={() => onOpenChange(false)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-sm font-medium transition",
                        focusItemClass,
                        selected
                          ? "bg-[var(--brand-accent)]/10 text-[var(--brand-accent)]"
                          : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]",
                      )}
                      aria-current={selected ? "page" : undefined}
                    >
                      <span
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg",
                          selected
                            ? "bg-[var(--brand-accent)] text-white"
                            : "bg-[var(--surface-muted)] text-[var(--text-muted)]",
                        )}
                      >
                        <NavModuleIcon navKey={item.key} className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </>,
    document.body,
  );
}
