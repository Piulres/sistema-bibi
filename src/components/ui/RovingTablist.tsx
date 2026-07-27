"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { resolveRovingKey } from "@/lib/a11y/focus";
import { cn } from "@/lib/utils/cn";

export type RovingTabItem = {
  id: string;
  label: ReactNode;
  shortLabel?: ReactNode;
};

type Props = {
  items: RovingTabItem[];
  activeId: string;
  onSelect: (id: string) => void;
  "aria-label": string;
  className?: string;
  /** Classes do botão da aba (recebe selected). */
  tabClassName?: (selected: boolean) => string;
};

/**
 * Tablist com roving tabindex + setas/Home/End.
 * Para filtros/seções client-side que já usam role=tablist ad-hoc.
 */
export default function RovingTablist({
  items,
  activeId,
  onSelect,
  "aria-label": ariaLabel,
  className,
  tabClassName,
}: Props) {
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  function focusAndSelect(id: string) {
    onSelect(id);
    requestAnimationFrame(() => {
      tabRefs.current.get(id)?.focus();
    });
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, id: string) {
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) return;
    const result = resolveRovingKey(event.key, index, items.length, "horizontal");
    if (result.type === "none") return;
    event.preventDefault();
    const next = items[result.index];
    if (next) focusAndSelect(next.id);
  }

  return (
    <div role="tablist" aria-label={ariaLabel} className={className}>
      {items.map((item) => {
        const selected = activeId === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onSelect(item.id)}
            onKeyDown={(event) => onKeyDown(event, item.id)}
            ref={(node) => {
              if (node) tabRefs.current.set(item.id, node);
              else tabRefs.current.delete(item.id);
            }}
            className={cn(
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] focus-visible:ring-offset-2",
              tabClassName?.(selected),
            )}
          >
            {item.shortLabel != null ? (
              <>
                <span className="sm:hidden">{item.shortLabel}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </>
            ) : (
              item.label
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Props de teclado/roving para botões tab já existentes no JSX do consumidor. */
export function useRovingTablistKeyDown(
  ids: string[],
  activeId: string,
  onSelect: (id: string) => void,
) {
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  function register(id: string, node: HTMLButtonElement | null) {
    if (node) tabRefs.current.set(id, node);
    else tabRefs.current.delete(id);
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, id: string) {
    const index = ids.indexOf(id);
    if (index < 0) return;
    const result = resolveRovingKey(event.key, index, ids.length, "horizontal");
    if (result.type === "none") return;
    event.preventDefault();
    const nextId = ids[result.index];
    if (!nextId) return;
    onSelect(nextId);
    requestAnimationFrame(() => {
      tabRefs.current.get(nextId)?.focus();
    });
  }

  function tabProps(id: string) {
    const selected = activeId === id;
    return {
      role: "tab" as const,
      "aria-selected": selected,
      tabIndex: selected ? 0 : -1,
      ref: (node: HTMLButtonElement | null) => register(id, node),
      onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => onKeyDown(event, id),
    };
  }

  return { tabProps };
}
