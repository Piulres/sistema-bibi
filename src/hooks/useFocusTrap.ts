"use client";

import { useEffect, useRef, type RefObject } from "react";
import { focusInitialIn, trapTabKey } from "@/lib/a11y/focus";

type Options = {
  /** Quando true, ativa trap + restaura foco ao desativar. */
  enabled: boolean;
  containerRef: RefObject<HTMLElement | null>;
  /** Preferência de foco inicial (seletor CSS dentro do container). */
  initialFocusSelector?: string | null;
  /** Escape fecha o overlay (caller decide o efeito). */
  onEscape?: () => void;
  /**
   * Nó para restaurar o foco ao fechar.
   * Se omitido, usa o elemento ativo no momento em que o trap foi habilitado.
   */
  restoreFocusRef?: RefObject<HTMLElement | null>;
};

/**
 * Focus trap + restore para dialogs/drawers.
 * - Tab/Shift+Tab ciclam dentro do container
 * - Escape chama onEscape
 * - Ao fechar, devolve o foco ao gatilho
 */
export function useFocusTrap({
  enabled,
  containerRef,
  initialFocusSelector,
  onEscape,
  restoreFocusRef,
}: Options) {
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const onEscapeRef = useRef(onEscape);

  useEffect(() => {
    onEscapeRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!enabled) return;

    previouslyFocused.current =
      restoreFocusRef?.current ??
      (document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null);

    const restoreTarget =
      restoreFocusRef?.current ?? previouslyFocused.current;

    const container = containerRef.current;
    if (!container) return;

    const frame = requestAnimationFrame(() => {
      const node = containerRef.current;
      if (node) focusInitialIn(node, initialFocusSelector);
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onEscapeRef.current?.();
        return;
      }
      const node = containerRef.current;
      if (node) trapTabKey(event, node);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      if (restoreTarget && typeof restoreTarget.focus === "function") {
        restoreTarget.focus();
      }
    };
  }, [enabled, containerRef, initialFocusSelector, restoreFocusRef]);
}
