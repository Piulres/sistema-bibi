"use client";

import { useCallback, useEffect, useState } from "react";

type DraftUndoOptions<T> = {
  storageKey: string;
  initialValue: T;
  serialize?: (value: T) => string;
  deserialize?: (raw: string) => T;
};

const defaultSerialize = JSON.stringify;
const defaultDeserialize = <T,>(raw: string): T => JSON.parse(raw) as T;

/**
 * Rascunho com undo local e persistência opcional em sessionStorage (Pacote B).
 */
export function useDraftUndo<T>(options: DraftUndoOptions<T>) {
  const serialize = options.serialize ?? defaultSerialize;
  const deserialize = options.deserialize ?? defaultDeserialize;

  const readStored = useCallback((): T | null => {
    if (typeof window === "undefined") return null;
    try {
      const raw = sessionStorage.getItem(options.storageKey);
      return raw ? deserialize(raw) : null;
    } catch {
      return null;
    }
  }, [options.storageKey, deserialize]);

  const [value, setValueState] = useState<T>(() => readStored() ?? options.initialValue);
  const [history, setHistory] = useState<T[]>([]);

  useEffect(() => {
    try {
      sessionStorage.setItem(options.storageKey, serialize(value));
    } catch {
      // quota ou modo privado
    }
  }, [value, options.storageKey, serialize]);

  const setValue = useCallback((next: T | ((prev: T) => T)) => {
    setValueState((prev) => {
      const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      if (JSON.stringify(resolved) !== JSON.stringify(prev)) {
        setHistory((h) => [...h.slice(-49), prev]);
      }
      return resolved;
    });
  }, []);

  const undo = useCallback(() => {
    setHistory((stack) => {
      if (stack.length === 0) return stack;
      const previous = stack[stack.length - 1]!;
      setValueState(previous);
      return stack.slice(0, -1);
    });
  }, []);

  const clearDraft = useCallback(() => {
    setHistory([]);
    setValueState(options.initialValue);
    try {
      sessionStorage.removeItem(options.storageKey);
    } catch {
      // ignore
    }
  }, [options.initialValue, options.storageKey]);

  return {
    value,
    setValue,
    undo,
    clearDraft,
    canUndo: history.length > 0,
  };
}
