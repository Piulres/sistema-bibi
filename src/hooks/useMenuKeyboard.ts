"use client";

import { useEffect, useRef, type RefObject } from "react";
import { getFocusableElements, resolveRovingKey } from "@/lib/a11y/focus";

type Options = {
  open: boolean;
  menuRef: RefObject<HTMLElement | null>;
  triggerRef?: RefObject<HTMLElement | null>;
  onClose: () => void;
  /** horizontal raramente; menus dropdown são verticais. */
  orientation?: "vertical" | "horizontal";
};

/**
 * Teclado WAI-ARIA para menus (role=menu): Escape, setas, Home/End,
 * foco no primeiro item ao abrir e restore no gatilho ao fechar.
 */
export function useMenuKeyboard({
  open,
  menuRef,
  triggerRef,
  onClose,
  orientation = "vertical",
}: Options) {
  const wasOpen = useRef(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      if (wasOpen.current) {
        triggerRef?.current?.focus();
      }
      wasOpen.current = false;
      return;
    }
    wasOpen.current = true;

    const frame = requestAnimationFrame(() => {
      const menu = menuRef.current;
      if (!menu) return;
      const items = getFocusableElements(menu);
      items[0]?.focus();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      const menu = menuRef.current;
      if (!menu) return;

      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }

      const items = getFocusableElements(menu);
      if (items.length === 0) return;

      const currentIndex = items.findIndex((el) => el === document.activeElement);
      const result = resolveRovingKey(
        event.key,
        currentIndex < 0 ? 0 : currentIndex,
        items.length,
        orientation,
      );
      if (result.type === "none") return;

      event.preventDefault();
      items[result.index]?.focus();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, menuRef, triggerRef, orientation]);
}
