"use client";

import { useCallback, useState } from "react";

/**
 * Histórico local para undo/redo em formulários (Pacote B — R0).
 * Não persiste no servidor até o submit.
 */
export function useFormUndo<T>(initialValue: T) {
  const [value, setValueState] = useState(initialValue);
  const [history, setHistory] = useState<T[]>([]);
  const [future, setFuture] = useState<T[]>([]);

  const setValue = useCallback((next: T | ((prev: T) => T)) => {
    setValueState((prev) => {
      const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      if (JSON.stringify(resolved) !== JSON.stringify(prev)) {
        setHistory((h) => [...h.slice(-49), prev]);
        setFuture([]);
      }
      return resolved;
    });
  }, []);

  const undo = useCallback(() => {
    let restored: T | undefined;
    setHistory((stack) => {
      if (stack.length === 0) return stack;
      restored = stack[stack.length - 1];
      return stack.slice(0, -1);
    });
    if (restored !== undefined) {
      setFuture((f) => [value, ...f]);
      setValueState(restored);
    }
    return restored;
  }, [value]);

  const redo = useCallback(() => {
    let next: T | undefined;
    setFuture((stack) => {
      if (stack.length === 0) return stack;
      next = stack[0];
      return stack.slice(1);
    });
    if (next !== undefined) {
      setHistory((h) => [...h, value]);
      setValueState(next);
    }
    return next;
  }, [value]);

  const reset = useCallback((baseline: T) => {
    setHistory([]);
    setFuture([]);
    setValueState(baseline);
  }, []);

  return {
    value,
    setValue,
    undo,
    redo,
    reset,
    canUndo: history.length > 0,
    canRedo: future.length > 0,
  };
}
