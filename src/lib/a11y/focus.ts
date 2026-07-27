/**
 * Helpers de foco/teclado — base compartilhada para dialogs, menus e tablists.
 * Mantém a lógica pura testável sem DOM de teste (jsdom).
 */

export const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

/** Índice circular para roving tabindex / setas em tablist e menus. */
export function getNextRovingIndex(
  current: number,
  delta: number,
  length: number,
): number {
  if (length <= 0) return 0;
  return (current + delta + length * 10) % length;
}

export type RovingKeyResult =
  | { type: "move"; index: number }
  | { type: "home"; index: 0 }
  | { type: "end"; index: number }
  | { type: "none" };

/**
 * Interpreta setas/Home/End para listas horizontais (tabs) ou verticais (menus).
 * Retorna o índice alvo sem mutar o DOM — o caller aplica focus + tabIndex.
 */
export function resolveRovingKey(
  key: string,
  currentIndex: number,
  length: number,
  orientation: "horizontal" | "vertical" = "horizontal",
): RovingKeyResult {
  if (length <= 0) return { type: "none" };

  const prevKey = orientation === "horizontal" ? "ArrowLeft" : "ArrowUp";
  const nextKey = orientation === "horizontal" ? "ArrowRight" : "ArrowDown";

  if (key === prevKey) {
    return { type: "move", index: getNextRovingIndex(currentIndex, -1, length) };
  }
  if (key === nextKey) {
    return { type: "move", index: getNextRovingIndex(currentIndex, 1, length) };
  }
  if (key === "Home") {
    return { type: "home", index: 0 };
  }
  if (key === "End") {
    return { type: "end", index: length - 1 };
  }
  return { type: "none" };
}

export function isElementVisible(el: HTMLElement): boolean {
  if (el.hasAttribute("hidden") || el.getAttribute("aria-hidden") === "true") {
    return false;
  }
  const style = typeof window !== "undefined" ? window.getComputedStyle(el) : null;
  if (style && (style.visibility === "hidden" || style.display === "none")) {
    return false;
  }
  return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
}

/** Lista elementos focáveis e visíveis dentro de um container (ordem do DOM = tab order). */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter((el) => {
    if (el.getAttribute("tabindex") === "-1") return false;
    // Subárvores aria-hidden/inert dentro do modal não entram no ciclo de Tab.
    const hiddenAncestor = el.closest("[aria-hidden='true'], [inert]");
    if (hiddenAncestor && hiddenAncestor !== container) return false;
    return isElementVisible(el);
  });
}

/**
 * Cicla Tab/Shift+Tab dentro do container. Retorna true se tratou o evento.
 */
export function trapTabKey(
  event: KeyboardEvent,
  container: HTMLElement,
): boolean {
  if (event.key !== "Tab") return false;

  const focusable = getFocusableElements(container);
  if (focusable.length === 0) {
    event.preventDefault();
    container.focus();
    return true;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement as HTMLElement | null;

  if (event.shiftKey) {
    if (!active || active === first || !container.contains(active)) {
      event.preventDefault();
      last.focus();
      return true;
    }
  } else if (!active || active === last || !container.contains(active)) {
    event.preventDefault();
    first.focus();
    return true;
  }

  return false;
}

/** Foca o primeiro focável, ou o próprio container se não houver. */
export function focusInitialIn(
  container: HTMLElement,
  preferredSelector?: string | null,
): void {
  if (preferredSelector) {
    const preferred = container.querySelector<HTMLElement>(preferredSelector);
    if (preferred && isElementVisible(preferred)) {
      preferred.focus();
      return;
    }
  }

  const autofocus = container.querySelector<HTMLElement>("[autofocus], [data-autofocus]");
  if (autofocus && isElementVisible(autofocus)) {
    autofocus.focus();
    return;
  }

  const focusable = getFocusableElements(container);
  if (focusable[0]) {
    focusable[0].focus();
    return;
  }

  if (!container.hasAttribute("tabindex")) {
    container.tabIndex = -1;
  }
  container.focus();
}
